const express = require('express')
const bcrypt = require('bcryptjs') 
const jwt = require('jsonwebtoken') 


  const knex = require('knex')({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    ssl: {
        require: false,
        rejectUnauthorized: false, 
      },
    debug: true,
  });


let apiRouter = express.Router()

const endpoint = '/'

let checkToken = (req, res, next) => {
  let authToken = req.headers["authorization"]
  if (!authToken) {
    res.status(401).json({ message: 'Token de acesso requerida' })
  }
  else {
    let token = authToken.split(' ')[1]
    req.token = token
  }
  jwt.verify(req.token, process.env.SECRET_KEY, (err, decodeToken) => {
    if (err) {
      res.status(401).json({ message: 'Acesso negado' })
      return
    }
    req.usuarioId = decodeToken.id
    next()
  })
}

let isAdmin = (req, res, next) => {

  knex
    .select('*').from('users').where({ pid: req.usuarioId })
    .then((usuarios) => {
      if (usuarios.length) {
        let usuario = usuarios[0]
        if (usuario.isadmin) {
          next()
          return
        }
        else {
          res.status(403).json({ message: 'Necessário ser ADMIN para prosseguir com a solicitação' })
          return
        }
      }
    })
    .catch(err => {
      res.status(500).json({
        message: 'Erro ao consultar usuário - ' + err.message
      })
    })
} 

apiRouter.get(endpoint + 'category', checkToken, (req, res) => {

  const {page = 1, pageSize = 10, sortBy = 'pid', sortOrder = 'asc', description} = req.query;
  const offset = (page - 1) * pageSize;
  

  let query = knex.select('*').from('category');

  // Aplicar filtro pelo nome, se fornecido
  if (description) {

      query.where('description', 'ilike', `%${description}%`);

  }

  // Aplicar ordenação
  query.orderBy(sortBy, sortOrder);

  // Aplicar paginação
  query.limit(pageSize).offset(offset);

  query.then(category => {
    const result = {
      data: category,
      links: {
        self: 'https://gerenciamentoprodutos-webapi-nodejs.com'+req.originalUrl, // Link para a lista atual
      },
    };

    res.status(200).json(result);
  }).catch(err => {
    res.status(500).json({
      message: 'Erro ao recuperar categorias - ' + err.message
    });
  });
});

apiRouter.get(endpoint + 'category/:id', checkToken, (req, res) => {
  const categoryId = req.params.id;

  knex.select('*')
    .from('category')
    .where('pid', categoryId)
    .then(category => {
      if (category.length > 0) {
        const result = {
          data: category[0],
          links: {
            self: 'https://gerenciamentoprodutos-webapi-nodejs.com'+req.originalUrl, // Link para o recurso atual
            collection: 'https://gerenciamentoprodutos-webapi-nodejs.com/api/' + 'category', // Link para a coleção de categorias
          },
        };
        res.status(200).json(result);
      } else {
        res.status(404).json({ message: 'Categoria não encontrada' });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    });
});

apiRouter.post(endpoint + 'category', checkToken, isAdmin, (req, res) => {
  const newCategory = req.body;

  if (!newCategory) {
    return res.status(400).json({ error: 'Os dados da categoria são obrigatórios' });
  }

  knex('category')
    .insert(newCategory)
    .returning('*')
    .then(created => {
      res.status(201).json(created[0]);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    });
});

apiRouter.put(endpoint + 'category/:id', checkToken, isAdmin, (req, res) => { 
  const categoryId = req.params.id;
  const updatedData = req.body;

knex('category')
  .where('pid', categoryId)
  .update(updatedData)
  .returning('*')  
  .then(updated => {
    if (updated.length > 0) {
      res.status(200).json(updated[0]);
    } else {
      res.status(404).json({ message: 'Categoria não encontrada' });
    }
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao processar a solicitação' });
  });
})

apiRouter.delete(endpoint + 'category/:id', checkToken, isAdmin, (req, res) => { 
  const categoryId = req.params.id;

knex('category')
  .where('pid', categoryId)
  .del()
  .returning('*')  
  .then(excluded => {
    if (excluded.length > 0) {
      res.status(200).json(excluded[0]);
    } else {
      res.status(404).json({ message: 'Categoria não encontrada' });
    }
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  });
})


apiRouter.get(endpoint + 'products', checkToken, (req, res) => {

  const {page = 1, pageSize = 10, sortBy = 'pid', sortOrder = 'asc', description} = req.query;
  const offset = (page - 1) * pageSize;
  

  let query = knex.select('*').from('products');

  // Aplicar filtro pelo nome, se fornecido
  if (description) {

      query.where('name', 'ilike', `%${description}%`);

  }

  // Aplicar ordenação
  query.orderBy(sortBy, sortOrder);

  // Aplicar paginação
  query.limit(pageSize).offset(offset);

  query.then(products => {
    const result = {
      data: products,
      links: {
        self: 'https://gerenciamentoprodutos-webapi-nodejs.com'+req.originalUrl, // Link para a lista atual
      },
    };

    res.status(200).json(result);
  }).catch(err => {
    res.status(500).json({
      message: 'Erro ao recuperar produtos - ' + err.message
    });
  });
});

apiRouter.get(endpoint + 'products/:id', checkToken, (req, res) => {
  const productId = req.params.id;

  knex.select('*')
    .from('products')
    .where('pid', productId)
    .then(products => {
      if (products.length > 0) {
        const result = {
          data: products[0],
          links: {
            self: 'https://gerenciamentoprodutos-webapi-nodejs.com'+req.originalUrl, // Link para o recurso atual
            collection: 'https://gerenciamentoprodutos-webapi-nodejs.com/api/' + 'products', // Link para a coleção de produtos
          },
        };
        res.status(200).json(result);
      } else {
        res.status(404).json({ message: 'Produto não encontrado' });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    });
});

apiRouter.post(endpoint + 'products', checkToken, isAdmin, (req, res) => {
    const newProduct = req.body;
  
    if (!newProduct) {
      return res.status(400).json({ error: 'Os dados do produto são obrigatórios' });
    }
  
    knex('products')
      .insert(newProduct)
      .returning('*')
      .then(created => {
        res.status(201).json(created[0]);
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Erro ao processar a solicitação' });
      });
});
  
apiRouter.put(endpoint + 'products/:id', checkToken, isAdmin, (req, res) => { 
    const productId = req.params.id;
  const updatedData = req.body;

  knex('products')
    .where('pid', productId)
    .update(updatedData)
    .returning('*')  
    .then(updated => {
      if (updated.length > 0) {
        res.status(200).json(updated[0]);
      } else {
        res.status(404).json({ message: 'Produto não encontrado' });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ erro: 'Erro ao processar a solicitação' });
    });
 })

apiRouter.delete(endpoint + 'products/:id', checkToken, isAdmin, (req, res) => { 
    const productId = req.params.id;

  knex('products')
    .where('pid', productId)
    .del()
    .returning('*')  
    .then(excluded => {
      if (excluded.length > 0) {
        res.status(200).json(excluded[0]);
      } else {
        res.status(404).json({ message: 'Produto não encontrado' });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    });
 })

 apiRouter.get(endpoint + 'usuario', checkToken, (req, res) => {

  const {page = 1, pageSize = 10, sortBy = 'pid', sortOrder = 'asc', description} = req.query;
  const offset = (page - 1) * pageSize;
  

  let query = knex.select('*').from('users');

  // Aplicar filtro pelo nome, se fornecido
  if (description) {

      query.where('name', 'ilike', `%${description}%`);

  }

  // Aplicar ordenação
  query.orderBy(sortBy, sortOrder);

  // Aplicar paginação
  query.limit(pageSize).offset(offset);

  query.then(users => {
    const result = {
      data: users,
      links: {
        self: 'https://gerenciamentoprodutos-webapi-nodejs.com'+req.originalUrl, // Link para a lista atual
      },
    };

    res.status(200).json(result);
  }).catch(err => {
    res.status(500).json({
      message: 'Erro ao recuperar usuários - ' + err.message
    });
  });
});

apiRouter.post(endpoint + 'usuario', (req, res) => {
  knex('users')
    .insert({
      name: req.body.name,
      login: req.body.login,
      password: bcrypt.hashSync(req.body.password, 8),
      isadmin: req.body.isadmin
    }, ['pid'])
    .then((result) => {
      let usuario = result[0]
      res.status(200).json({ "id": usuario.id })
      return
    })
    .catch(err => {
      res.status(500).json({
        message: 'Erro ao registrar usuario - ' + err.message
      })
    })
})

apiRouter.get(endpoint + 'usuario/:id', checkToken, (req, res) => {
  const usuarioId = req.params.id;

  knex.select('*')
    .from('users')
    .where('pid', usuarioId)
    .then(user => {
      if (user.length > 0) {
        const result = {
          data: user[0],
          links: {
            self: 'https://gerenciamentoprodutos-webapi-nodejs.com'+req.originalUrl, // Link para o recurso atual
            collection: 'https://gerenciamentoprodutos-webapi-nodejs.com/api/' + 'usuario', // Link para a coleção de produtos
          },
        };
        res.status(200).json(result);
      } else {
        res.status(404).json({ message: 'Usuário não encontrado' });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    });
});

apiRouter.put(endpoint + 'usuario/:id', checkToken, isAdmin, (req, res) => { 
  const usuarioId = req.params.id;
const updatedData = req.body;

knex('users')
  .where('pid', usuarioId)
  .update(updatedData)
  .returning('*')  
  .then(updated => {
    if (updated.length > 0) {
      res.status(200).json(updated[0]);
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao processar a solicitação' });
  });
})

apiRouter.delete(endpoint + 'usuario/:id', checkToken, isAdmin, (req, res) => { 
  const usuarioId = req.params.id;

knex('users')
  .where('pid', usuarioId)
  .del()
  .returning('*')  
  .then(excluded => {
    if (excluded.length > 0) {
      res.status(200).json(excluded[0]);
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  });
})

apiRouter.post(endpoint + 'usuario/autenticacao', (req, res) => {
  knex
    .select('*').from('users').where({ login: req.body.login })
    .then(usuarios => {
      if (usuarios.length) {
        let usuario = usuarios[0]
        let checkSenha = bcrypt.compareSync(req.body.password, usuario.password)
        if (checkSenha) {
          var tokenJWT = jwt.sign({ id: usuario.pid },
            process.env.SECRET_KEY, {
            expiresIn: 3600
          })
          res.status(200).json({
            id: usuario.pid,
            login: usuario.login,
            name: usuario.name,
            isAdmin: usuario.isadmin,
            token: tokenJWT
          })
          return
        }
      }

      res.status(403).json({ message: 'Login ou senha incorretos' })
    })
    .catch(err => {
      res.status(500).json({
        message: 'Erro ao verificar login - ' + err.message
      })
    })
})

module.exports = apiRouter;
