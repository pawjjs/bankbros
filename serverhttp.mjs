import { createServer } from 'node:http'
const server = createServer((request, response) => {
const historia = {
    data: new Date(),
    message: 'Server działa'

}
response.statusCode = 200

response.setHeader(
'Content-Type',
'application/json'
)

if (request.url === '/') {
    response.end(JSON.stringify('Strona główna'))
    return
}
else if(request.url === '/historia') {
    response.end(JSON.stringify(historia))
}
else{
    response.statusCode = 404;
    response.end(JSON.stringify('Nie znaleziono strony'));
}

})
server.listen(3300)