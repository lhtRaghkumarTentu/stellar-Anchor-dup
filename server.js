const express = require('express');
const app = express();
const port = process.env.PORT || 4000;
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const stellar = require('stellar-sdk');
const jwt = require("jsonwebtoken");
const { Transaction } = require('stellar-sdk');

app.get("/",(req,res)=>{
    res.send("Hello is This Working!!!!!!!!!!!!")
});

app.use(cors());

const SERVER_KEY_PAIR = stellar.Keypair.fromSecret("SAKWQQN75RVS4MB4SY2DNRP5PQSOHGI5BLKZLQ7SDH34ENARWQGQ5OGO");
const INVALID_SEQUENCE = "-1"
const CHALLENGE_EXPIRE_IN = 800
const randomNonce = () => {
    return crypto.randomBytes(32).toString("hex");
};



//SEP01
app.get('/.well-known/stellar.toml', (req, res, next) => {
    const options = {
      root: path.join(__dirname, 'public'),
    }
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("content-type", "text/plain");
    res.sendFile('stellar.toml', options);
})

//SEP24
app.get('/sep24/info',(req,res)=>{
res.json({
    "deposit": {
        "Slht": {
            "enabled": true,
            "fee_fixed": 1.0
        }
    },
    "withdraw": {
        "Slht": {
            "enabled": true,
            "fee_fixed": 1.0
        }
    },
    "fee": {
        "enabled": true
    },
    "features": {
        "account_creation": true,
        "claimable_balances": true
    }
})
})

//SEP06
app.get('/sep6/info',(req,res)=>{
    res.json({
        "deposit": {
            "Slht": {
                "enabled": true,
                "authentication_required": true,
                "fields": {
                    "type": {
                        "description": "'bank_account' is the only value supported'",
                        "choices": [
                            "bank_account"
                        ]
                    }
                }
            }
        },
        "withdraw": {
            "Slht": {
                "enabled": true,
                "authentication_required": true,
                "types": {
                    "bank_account": {
                        "fields": {
                            "dest": {
                                "description": "bank account number"
                            },
                            "dest_extra": {
                                "description": "bank routing number"
                            }
                        }
                    }
                }
            }
        },
        "fee": {
            "enabled": true,
            "authentication_required": true
        },
        "transactions": {
            "enabled": true,
            "authentication_required": true
        },
        "transaction": {
            "enabled": true,
            "authentication_required": true
        },
        "features": {
            "account_creation": true,
            "claimable_balances": true
        },
        "deposit-exchange": {
            "Slht": {
                "enabled": true,
                "authentication_required": true,
                "fields": {
                    "type": {
                        "description": "'bank_account' is the only value supported'",
                        "choices": [
                            "bank_account"
                        ]
                    }
                }
            }
        },
        "withdraw-exchange": {
            "Slht": {
                "enabled": true,
                "authentication_required": true,
                "types": {
                    "bank_account": {
                        "fields": {
                            "dest": {
                                "description": "bank account number"
                            },
                            "dest_extra": {
                                "description": "bank routing number"
                            }
                        }
                    }
                }
            }
        }
    })
})

//SEP10
app.get('/auth',async(req, res) => {
    const clientPublicKey = req.query.account;
    const minTime = Math.floor(Date.now() / 1000);
    console.log(minTime);
    const maxTime = minTime + CHALLENGE_EXPIRE_IN;
    const timebounds = {
      minTime: minTime.toString(),
      maxTime: maxTime.toString()
    };
    const op = stellar.Operation.manageData({
        source: clientPublicKey,
        name: "stellaranchordup.herokuapp.com auth",
        value: randomNonce()
      });
    const account = new stellar.Account(SERVER_KEY_PAIR.publicKey(), INVALID_SEQUENCE);
    const tx = new stellar.TransactionBuilder(account, { timebounds,fee:100}).addOperation(op).setNetworkPassphrase(stellar.Networks.TESTNET).build()
    tx.sign(SERVER_KEY_PAIR);
    res.json ({ transaction: tx.toEnvelope().toXDR("base64"), network_passphrase: stellar.Networks.TESTNET});
})

app.post('/sign',(req,res)=>{
    const tx = new stellar.Transaction(req.query.transaction,stellar.Networks.TESTNET);
    tx.sign(SERVER_KEY_PAIR);
    res.json ({ transaction: tx.toEnvelope().toXDR("base64"), network_passphrase: stellar.Networks.TESTNET});
})


app.listen(port,()=>{
    console.log(`App is Running Locally on Port http://localhost:${port}`)
})

