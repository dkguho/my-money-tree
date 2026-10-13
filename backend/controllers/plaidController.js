// backend/controllers/plaidController.js
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const Budget = require("../models/Budget");

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});
const client = new PlaidApi(configuration);

// 1. Start the link process
const createLinkToken = async (req, res) => {
  try {
    const response = await client.linkTokenCreate({
      user: { client_user_id: req.user.username }, // Tied securely to the logged-in user
      client_name: "GoalJar",
      products: ["transactions", "auth"],
      country_codes: ["US"],
      language: "en",
    });
    res.json(response.data);
  } catch (error) {
    console.error("Link Token Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to initialize bank link" });
  }
};

// 2. Save the permanent bank token and switch to AUTO mode
const exchangePublicToken = async (req, res) => {
  try {
    const { public_token } = req.body;
    
    // Trade temporary public token for permanent access token
    const tokenResponse = await client.itemPublicTokenExchange({ public_token });
    const accessToken = tokenResponse.data.access_token;

    // Fetch the accounts to get the bank name (e.g., "Plaid Checking")
    const accountsResponse = await client.accountsGet({ access_token: accessToken });
    const primaryAccount = accountsResponse.data.accounts[0]; 

    // Update the user's database document
    await Budget.findOneAndUpdate(
      { username: req.user.username },
      { 
        syncMode: "auto",
        plaidAccessToken: accessToken,
        plaidAccountId: primaryAccount.account_id,
        plaidInstName: primaryAccount.name
      }
    );

    res.json({ success: true, message: "Bank connected in Auto Mode!" });
  } catch (error) {
    console.error("Exchange Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to connect bank account" });
  }
};

// 3. Fetch Real-Time Balance (Overrides Manual Income)
const getBankBalance = async (req, res) => {
  try {
    const budget = await Budget.findOne({ username: req.user.username });
    if (!budget || budget.syncMode !== "auto" || !budget.plaidAccessToken) {
      return res.status(400).json({ error: "User is not in auto mode." });
    }

    const response = await client.accountsBalanceGet({
      access_token: budget.plaidAccessToken,
    });

    // Find the specific connected account
    const account = response.data.accounts.find(a => a.account_id === budget.plaidAccountId) 
                    || response.data.accounts[0];

    // Bank balance available to spend
    const currentBalance = account.balances.available || account.balances.current;

    // Automatically update the "Income" field in the database with the real live balance
    budget.income = currentBalance;
    budget.incomeDate = Date.now();
    await budget.save();

    res.json({ balance: currentBalance, accountName: account.name });
  } catch (error) {
    console.error("Balance Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch live balance" });
  }
};

// 4. Sync New Card Swipes into the "Inbox"
const syncBankTransactions = async (req, res) => {
  try {
    const budget = await Budget.findOne({ username: req.user.username });
    if (!budget || budget.syncMode !== "auto" || !budget.plaidAccessToken) {
      return res.status(400).json({ error: "User is not in auto mode." });
    }

    let hasMore = true;
    let cursor = budget.plaidCursor;
    let newTransactions = [];

    // Fetch all new transactions since the last time we checked (using the cursor)
    while (hasMore) {
      const response = await client.transactionsSync({
        access_token: budget.plaidAccessToken,
        cursor: cursor,
      });

      newTransactions = newTransactions.concat(response.data.added);
      cursor = response.data.next_cursor;
      hasMore = response.data.has_more;
    }

    // Filter only for expenses (Plaid represents purchases as positive numbers)
    const expensesOnly = newTransactions
      .filter(tx => tx.amount > 0)
      .map(tx => ({
        transaction_id: tx.transaction_id,
        name: tx.merchant_name || tx.name, // E.g., "Netflix"
        amount: tx.amount,
        date: tx.date,
        pending: tx.pending
      }));

    if (expensesOnly.length > 0 || cursor !== budget.plaidCursor) {
      budget.plaidCursor = cursor;
      budget.bankInbox.push(...expensesOnly);
      await budget.save();
    }

    res.json({ newItemsCount: expensesOnly.length, inbox: budget.bankInbox });
  } catch (error) {
    console.error("Sync Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to sync transactions" });
  }
};

module.exports = { 
  createLinkToken, 
  exchangePublicToken, 
  getBankBalance, 
  syncBankTransactions 
};