# Ritmo

App de running y diario privado de entrenamiento.

**Abrir la app:** https://aneiturri.github.io/ritmo-running/

## Guardado entre móvil y ordenador

La web está conectada con Supabase. Entra en **Cuenta**, introduce tu correo y abre el enlace de acceso en cada dispositivo. Usa el mismo correo en ambos. Antes de cerrar, comprueba el indicador **Sincronizado**.

Si ya tenías sesiones en un navegador, inicia sesión y usa **Importar los registros locales a esta cuenta**.

## Contenido

- Plan de 22 semanas, tres carreras y fuerza en casa.
- Menú lateral desplegable y diseño adaptable.
- Diario con kilómetros, tiempo, esfuerzo y notas.
- RLS para separar los registros de cada cuenta y cola de cambios pendientes sin conexión.

## Código

HTML sin compilación, servido por GitHub Pages desde la raíz de main. DEFAULT_CONFIG contiene únicamente la URL y clave pública de Supabase. No añadas claves secretas ni service_role. schema.sql define las tablas, permisos y guardado.

Las pruebas transaccionales de guardado, aislamiento entre dos cuentas y conflictos de ediciones han pasado. El acceso por correo se completa por la usuaria. Consulta LEEME.txt para la referencia de instalación.
