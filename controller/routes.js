const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require("axios")
const jwkToPem = require('jwk-to-pem');
const { check, validationResult } = require("express-validator");
const { CognitoUserPool, CognitoUserAttribute, CognitoUser, AuthenticationDetails } = require("amazon-cognito-identity-js")
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require("../models/user");
const PurchasedItems = require("../models/purchased");

const poolData = {
    UserPoolId: process.env.USER_POOL_ID,
    ClientId: process.env.CLIENT_ID
};

const userPool = new CognitoUserPool(poolData);

router.get("/",(req,res)=>{
    res.status(200).send("Welcome to the backend")
})

router.route("/signup")
    .post((req, res, next) => {
        check("email").isEmail().run(req);
        check("password").isLength({ min: 8 }).isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
            .matches(/[!@#$%^&*]/).withMessage('Password must contain at least 1 special character').matches(/[A-Z]/)
            .withMessage('Password must contain at least 1 uppercase letter')
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }
        next();
    }, (req, res) => {
        const attributeList = [];
        const dataEmail = {
            Name: 'email',
            Value: req.body.email
        };
        const dataName = {
            Name: 'name',
            Value: req.body.name
        };
        const dataPhoneNumber = {
            Name: 'phone_number',
            Value: req.body.phone
        };
        const attributeEmail = new CognitoUserAttribute(dataEmail);
        const attributeName = new CognitoUserAttribute(dataName);
        const attributePhoneNumber = new CognitoUserAttribute(dataPhoneNumber);
        attributeList.push(attributeEmail);
        attributeList.push(attributeName);
        attributeList.push(attributePhoneNumber);
        userPool.signUp(req.body.email, req.body.password, attributeList, null, (err, result) => {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                User.create({
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                }).then((res) => {
                    console.log(res);
                }).catch((e) => {
                    console.log(e);
                })
                res.status(200).json('Sign-up successful! Now please verify your email and login');
            }
        });
    })

router.route("/signin").get(authenticateToken, (req, res) => { res.send("hello") })
    .post((req, res) => {
        const authenticationDetails = new AuthenticationDetails({
            Username: req.body.email,
            Password: req.body.password,
        });
        const userData = {
            Username: req.body.email,
            Pool: userPool
        };
        const cognitoUser = new CognitoUser(userData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: async function (result) {
                res.status(200).send({ tokenJwt: result.getAccessToken().getJwtToken(), tokenId: result.getIdToken().getJwtToken() })
            },
            onFailure: function (err) {
                if (err)
                    console.log(err);
                res.status(400).send(err)
            },
        });
    })

router.post('/create-payment-intent', authenticateToken, async (req, res) => {
    try {
        const customer = await stripe.customers.create({
            name: req.body.name,
            email: req.body.email,
            address: {
                line1: req.body.line1,
                postal_code: req.body.postal_code,
                city: req.body.city,
                state: req.body.state,
                country: req.body.countryCode,
            }
        });
        const paymentIntent = await stripe.paymentIntents.create({
            currency: 'INR',
            customer: customer.id,
            amount: '50',
            description: "Test purpose",
            automatic_payment_methods: { enabled: true }
        });
        PurchasedItems.create({
            name: req.body.name,
            email: req.body.email,
            address: {
                line1: req.body.line1,
                postal_code: req.body.postal_code,
                city: req.body.city,
                state: req.body.state,
                country: req.body.countryCode,
            },
            product: [...req.body.products]
        }).then((res) => {
            console.log(res);
        }).catch((e) => {
            console.log(e);
        })
        res.send({ client_secret: paymentIntent.client_secret, });
    } catch (e) {return res.status(400).send(e);}
});

router.post('/purchased', authenticateToken, async (req, res) => {
    PurchasedItems.find({ email: req.body.email }).then(data => {
        res.status(200).json(data)
    }).catch(err => {
        res.status(500).send(err)
    });
});

async function authenticateToken(req, res, next) {
    const jwks = await fetchJWK()
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).send("Please provide a valid token");
    }
    const decodedToken = jwt.decode(token, { complete: true });
    const selectedKey = jwks.keys.find(key => key.kid === decodedToken.header.kid);
    const pem = jwkToPem(selectedKey);
    jwt.verify(token, pem, { algorithms: ['RS256'] }, (err) => {
        if (err) {
            return res.status(401).send(err);
        }
        next()
    });
}

router.post('/authverify', authenticateToken, async (req, res) => {
    const jwks = await fetchJWK()
    const decodedToken = jwt.decode(req.body.Idtoken, { complete: true });
    const selectedKey = jwks.keys.find(key => key.kid === decodedToken.header.kid);
    const pem = jwkToPem(selectedKey);
    jwt.verify(req.body.Idtoken, pem, { algorithms: ['RS256'] }, (err, decodedToken) => {
        if (err) {
            return res.status(401).send(err);
        }
        res.status(200).send({ name: decodedToken.name, email: decodedToken.email, phone: decodedToken.phone_number })
    });
});

async function fetchJWK() {
    try {
        const response = await axios.get(`https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`);
        return response.data
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error
    }
}
module.exports = router;
