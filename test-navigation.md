# Test de Navegación y Endpoints

## URLs para Probar:

### App1 (Miembros):
- `http://localhost:5050/app1` - Welcome Screen
- `http://localhost:5050/app1/welcome` - Welcome Screen
- `http://localhost:5050/app1/login` - Login de Miembros
- `http://localhost:5050/app1/register` - Registro de Miembros
- `http://localhost:5050/app1/dashboard` - Dashboard de Miembros

### App2 (Administradores):
- `http://localhost:5050/app2` - Login de Administradores
- `http://localhost:5050/app2/admin-login` - Login de Administradores
- `http://localhost:5050/app2/admin-register` - Registro de Administradores
- `http://localhost:5050/app2/admin-dashboard` - Dashboard de Administradores

## Endpoints API:

### Login de Admin:
```bash
curl -X POST http://localhost:5050/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rumbify.com","password":"admin123"}'
```

### Registro de Admin:
```bash
curl -X POST http://localhost:5050/admin/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Admin","email":"test@admin.com","password":"password123","phone":"1234567890"}'
```

## Flujo de Prueba:

1. **Iniciar servidor:** `npm start`
2. **Acceder a App1:** `http://localhost:5050/app1`
3. **Hacer clic en "Administrator"** - Debe redirigir a App2
4. **En App2, hacer clic en "Register Admin"** - Debe mostrar registro
5. **Probar login con credenciales:** admin@rumbify.com / admin123
6. **Verificar que funcione la navegación con botones atrás/adelante del navegador**
