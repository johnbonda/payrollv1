module.exports = {
    name: 'session',
    fields: [
        {
            name: 'email',
            type: 'String',
            length: 255
        },
        {
            name: 'jwtToken',
            type: 'String',
            length: 255
        },
    ]
}