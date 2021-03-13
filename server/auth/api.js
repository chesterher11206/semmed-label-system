import bcrypt from 'bcrypt';
import bookshelf from 'bookshelf'
import knex from 'knex'
import jwt from 'jsonwebtoken';
import { labelSystemConfig, jwtConfig } from './config.js';

const labelSystemKnex = knex(labelSystemConfig);
const labelSystemBookshelf = bookshelf(labelSystemKnex);

const User = labelSystemBookshelf.model('User', {
    tableName: 'USER',
    idAttribute: 'USERNAME'
});

const login = (req, res) => {
    const { username, password } = req.body;

    new User({ USERNAME: username }).fetch()
    .then(model => model.toJSON())
    .then(user => {
        const passwordIsValid = bcrypt.compareSync(password, user.PASSWORD);
        if (!passwordIsValid) {
            res.status(401).json({ auth: false, token: null });
        }
        else {
            const token = jwt.sign({ username }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
            res.status(200).json({ auth: true, token, user });
        }
    })
    .catch(error => {
        const msg = error.message;
        switch (msg) {
            case 'EmptyResponse':
                res.status(404).json({ message: msg });
                break;
            default:
                res.status(500).json({ message: msg });
        }
    });
}

export {
    login
};