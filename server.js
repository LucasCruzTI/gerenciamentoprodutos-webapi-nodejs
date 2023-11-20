require('dotenv').config()

const express = require ('express')
const cors = require('cors')
const path = require('path')
const app = express()
const apiRouter = require('./api/routes/apiRouter')
const swaggerUi = require('swagger-ui-express')
const swaggerDocs = require('./docs/swagger.json')


app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

app.use('/app', express.static (path.join( __dirname, '/public')))

let port = process.env.PORT || 3000
app.listen (port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

app.use ('/api', apiRouter)
