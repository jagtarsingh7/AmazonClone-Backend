const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios")
const jwkToPem = require('jwk-to-pem');
// const validateEmailAndPasswordFIelds = require('../middlewares/validation');
// const authenticateToken = require('../middlewares/authMiddleware');
const { CognitoUserPool, CognitoUserAttribute, CognitoUser , AuthenticationDetails} = require("amazon-cognito-identity-js")
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const poolData = {
    UserPoolId: process.env.USER_POOL_ID,
    ClientId: process.env.ClIENT_ID
};

const userPool = new CognitoUserPool(poolData);

router.route("/signup")
    .post(validateEmailAndPasswordFIelds,(req, res) => {

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
                res.status(400).send('Invalid user input. Please check your details.');
            }
            const cognitoUser = result.user;
            console.log("and result is " + cognitoUser)
            res.status(200).send('Sign-up successful!');
        });

    })


router.route("/signin")
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
                console.log('access token + ' + result.getAccessToken().getJwtToken());
                console.log('id token + ' + result.getIdToken().getJwtToken());
                console.log('refresh token + ' + result.getRefreshToken().getToken());
                try{
                    const jwk = await fetchJWK();
                    const pem = jwkToPem(jwk);
                    const accessToken = jwt.sign(req.body.name, pem, { algorithm: 'RS256' });
                    console.log('Generated Access Token:', accessToken);
                    res.status(200).send(accessToken)
                }
                catch(e){
                    res.status(500).send("something went wrong at server")
                }
            },
            onFailure: function(err) {
                console.log(err);
                res.status(400).send("Invalid details")
            },
        });
    })

router.post('/create-payment-intent', async (req, res) => {

    console.log("req.body.amount" + req.body.amount)
    console.log("req.body.id" + req.body.id)
    // Create a PaymentIntent with the amount, currency, and a payment method type.
    try {

        const customer = await stripe.customers.create({
            name: 'Test',
            address: {
                line1: '510 Townsend St',
                postal_code: '98140',
                city: 'San Francisco',
                state: 'CA',
                country: 'US',
            },
        });
        const paymentIntent = await stripe.paymentIntents.create({
            currency: 'INR',
            customer: customer.id,
            amount: req.body.amount,
            description: "test",
            automatic_payment_methods: { enabled: true }
        });

        // Send publishable key and PaymentIntent details to client
        console.log("clientSecret:" + paymentIntent.client_secret)
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
        console.log("sent")
    } catch (e) {
        console.log("error:" + e)
        return res.status(400).send({
            error: {
                message: e.message,
            },
        });
    }
});

function validateEmailAndPasswordFIelds() {
    return [
        check('email').isEmail(),
        check('password').custom(value => {
            if (!/(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(value)) {
                throw new Error('Password must contain at least 1 number, 1 special character, 1 uppercase letter, 1 lowercase letter, and be at least 6 characters long');
            }
            return true;
        }),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        }
    ];
}

async function fetchJWK() {
    try {
        const response = await axios.get(`https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`);
        console.log(response.data);
        return response.data
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error
    }
}

// router.route("/signup/verifyemail")
//     .get((req, res) => {
//         const token=req.params.token;
//         console.log("token"+token)
//         var userData = {
//             Username: 'jagtar.singh7@yahoo.com',
//             Pool: userPool
//         };
//         var cognitoUser = new CognitoUser(userData);
//         const verificationCode = token; // Replace with the actual verification code sent to the user
//         cognitoUser.confirmRegistration(verificationCode, true, (err, result) => {
//             if (err) {
//                 console.error(err);
//                 return res.status(400).json({ error: err.message });
//             }
//             console.log(`User successful created' ${cognitoUser.getUsername()}`);
//             res.send(`User successful created'${ cognitoUser.getUsername()}`)
//         });
//     })


// router.post('/webhook', async (req, res) => {
//     let data, eventType;
//     // Check if webhook signing is configured.
//     if (process.env.STRIPE_WEBHOOK_SECRET) {
//         // Retrieve the event by verifying the signature using the raw body and secret.
//         let event;
//         let signature = req.headers['stripe-signature'];
//         try {
//             event = stripe.webhooks.constructEvent(
//                 req.rawBody,
//                 signature,
//                 process.env.STRIPE_WEBHOOK_SECRET
//             );
//         } catch (err) {
//             console.log(`⚠️  Webhook signature verification failed.`);
//             return res.sendStatus(400);
//         }
//         data = event.data;
//         eventType = event.type;
//     } else {
//         // Webhook signing is recommended, but if the secret is not configured in `config.js`,
//         // we can retrieve the event data directly from the request body.
//         data = req.body.data;
//         eventType = req.body.type;
//     }
//     if (eventType === 'payment_intent.succeeded') {
//         // Funds have been captured
//         // Fulfill any orders, e-mail receipts, etc
//         // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
//         console.log('💰 Payment captured!');
//     } else if (eventType === 'payment_intent.payment_failed') {
//         console.log('❌ Payment failed.');
//     }
//     res.sendStatus(200);
// });


module.exports = router;
