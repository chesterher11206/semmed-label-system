const labelSystemConfig = {
    client: 'mysql',
    connection: {
        host: '140.112.107.121',
        user: 'med', 
        password: 'mrls2021',
        database: 'labelSystem',
        charset  : 'utf8'
    }
};

const jwtConfig = {
    secret: 'supersecret',
    expiresIn: 86400
}

export {
    labelSystemConfig,
    jwtConfig
};