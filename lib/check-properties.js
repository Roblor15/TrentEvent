const checkProperties = (properties) => (req, res, next) => {
    for (const property of properties) {
        if (req.body[property] === undefined) {
            return res.status(400).json({
                success: false,
                message: `${property} not provided`,
            });
        }
    }

    next();
};

module.exports = checkProperties;
