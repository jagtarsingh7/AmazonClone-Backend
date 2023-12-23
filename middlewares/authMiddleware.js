const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];
    if (token === "null") {
        return res.status(401).send("Please login first");
    }
    jwt.verify(token, process.env.PRIVATE_KEY, (err, user) => {
        if (err) return res.status(401).send("Please login first");
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
