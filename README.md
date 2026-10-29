# Ritmo

App de running y diario privado de entrenamiento.

**Abrir la app:** https://aneiturri.github.io/ritmo-running/

## Guardado entre móvil y ordenador

La web está conectada con Supabase y recuerda la sesión en cada navegador. Usa el mismo correo y tu contraseña de Ritmo en móvil y ordenador. La contraseña se puede establecer desde Cuenta en un navegador donde ya tengas una sesión abierta. Antes de cerrar, comprueba el indicador **Sincronizado**.

Si abres la app desde Teams, elige **Abrir en navegador** y usa siempre Safari o Chrome. El acceso por correo queda como alternativa y no se solicita automáticamente. Cerrar sesión en un navegador no cierra los otros dispositivos.

Si ya tenías sesiones en un navegador, inicia sesión y usa **Importar los registros locales a esta cuenta**.

## Contenido

- Plan de 22 semanas con dos salidas: lunes de 6–7 km y fondo el miércoles a las 18:45. Las carreras sustituyen una salida y tras el 10K solo hay una sesión de recuperación.
- Fondo progresivo desde 8–9 km hasta un máximo orientativo de 16 km o 110 minutos, con semanas de descarga y ajuste por sensaciones. Fuerza en casa opcional.
- Seis pestañas visibles en la navegación inferior y diseño adaptable.
- Anillos de progreso semanal y del plan, basados en entrenamientos de running completados.
- Selector de semanas y calendario mensual interactivo.
- Gráfico de barras verticales por meses: kilómetros previstos y registrados, de octubre de 2026 a abril de 2027. Los meses futuros no inventan datos reales.
- Diario de running con kilómetros, tiempo, esfuerzo y notas. Pádel y fuerza se muestran como orientación opcional y no se registran ni cuentan en los porcentajes.
- RLS para separar los registros de cada cuenta y cola de cambios pendientes sin conexión.

Las salidas registradas del plan anterior conservan sus identificadores, historial, kilómetros reales y edición. Una tercera salida retirada del calendario actual no cuenta como pendiente ni como completada del nuevo plan.

## Código

HTML sin compilación, servido por GitHub Pages desde la raíz de main. DEFAULT_CONFIG contiene únicamente la URL y clave pública de Supabase. No añadas claves secretas ni service_role. schema.sql define las tablas, permisos y guardado.

Las pruebas transaccionales de guardado, aislamiento entre dos cuentas y conflictos de ediciones han pasado. La creación de la contraseña y la comprobación final en los navegadores se completan por la usuaria. Consulta LEEME.txt para la referencia de instalación.

## Pruebas

`node tests/plan.test.mjs`

`node tests/auth.test.mjs`

`node tests/dashboard.test.mjs`

Las pruebas de sesión usan un cliente simulado: no envían correos ni acceden a cuentas reales.
