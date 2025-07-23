    // backend/src/routes/userRoutes.js
    const express = require('express');
    const userController = require('../controllers/userController');

    const router = express.Router();

    // Rutas para USUARIOS
    router.post('/usuario', userController.createUser);
    router.get('/usuarios', userController.getAllUsers);
    router.get('/usuario/:legajo', userController.getUserByLegajo);
    router.put('/usuario/:legajo', userController.updateUser);
    router.patch('/usuario/estado/:legajo', userController.updateUserStatus);
    router.delete('/usuario/:legajo', userController.deleteUser);
    router.post('/login', userController.loginUser);
    router.post('/usuario/cambiar-contrasena', userController.changePassword);
    router.post('/admin/reset-contrasena', userController.resetPasswordByAdmin); // Nueva ruta para admin

    module.exports = router;
    