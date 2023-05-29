const jwt = require('jsonwebtoken');

const check = (userType) => (req, res, next) => {
    let token;
    const authHeader = req.headers['authorization'];

    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7, authHeader.length);
    } else {
        return res
            .status(401)
            .json({ success: false, message: 'Authorization token not found' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log('valid');
        if (userType.includes(decoded.type)) {
            req.user = decoded;
            next();
        } else {
            res.status(403).json({
                success: false,
                message: 'You are not authorized',
            });
        }
    } catch (e) {
        res.status(401).json({
            success: false,
            message: 'Authentication token not valid',
        });
    }
};

module.exports = { check };
