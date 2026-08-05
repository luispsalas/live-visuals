# Live Audio-Reactive Visuals: Guía del usuario

*[English version](USER-GUIDE.md)*

Esta app escucha la música y pinta visuales generativos en tiempo real, que se
proyectan en un segundo monitor o pantalla. Se controla en vivo desde un
controlador MIDI, moviendo un fader o knob para barrer un efecto o presionando un
pad para disparar un look guardado, o bien, sin equipo MIDI a mano, alternando
entre hasta 8 looks guardados con las teclas numéricas del teclado.

---

## 1. Primeros pasos

**Lo único necesario es [Google Chrome](https://www.google.com/chrome/).** La app
corre dentro del navegador: no hay nada que instalar ni cuenta que crear.

**Abrir la app aquí: [https://luispsalas.github.io/live-visuals/](https://luispsalas.github.io/live-visuals/)**

Se abre ese enlace en Chrome y se hace clic en el botón **No sound**, junto a
*Start*. Los visuales empiezan a moverse de inmediato. Se pueden cambiar
**Source A** y **Source B** y mover algunos deslizadores, y con eso ya se ha
usado la mayor parte de la app.

Eso es, en la práctica, todo lo necesario para explorarla. Todo lo demás en esta
guía es opcional y solo hace falta para cosas específicas.

> **Si en vez de un enlace se recibió una carpeta de archivos** (sin enlace,
> solo archivos en la computadora), ver *Ejecutar desde una carpeta* al final de
> esta guía.

---

## 2. Qué permisos pedirá Chrome (y por qué)

Chrome mostrará uno o dos avisos de permiso. Pueden parecer alarmantes fuera de
contexto, así que aquí se explica exactamente qué es cada uno y qué hace:

| Chrome pregunta | Por qué la app lo necesita | Qué pasa en realidad |
|---|---|---|
| **"¿Usar el micrófono?"** | Es la única forma en que un navegador puede recibir audio, incluido el de un cable de audio virtual que lleva la música. | Se lee la entrada que **se elija** en el menú desplegable. No se graba nada, y nada se envía a ningún lado. |
| **"¿Compartir la pantalla?"** | Solo si se hace clic en **System audio**. Chrome no tiene una opción de "dame solo el audio", así que usa el diálogo de compartir pantalla para entregar el audio. | La app **descarta el video de inmediato** y conserva solo el sonido. |
| **"¿Usar la cámara?"** | Solo si se activan **Camera** o **Motion**. | La imagen se dibuja en pantalla y se usa para detectar movimiento; luego se descarta. |

**Nada sale de la computadora.** La app no tiene servidor, cuenta ni analítica:
no hace ninguna conexión a internet. Todo se procesa en la máquina y se descarta
cuadro a cuadro. Los presets guardados viven únicamente en el almacenamiento
local de este navegador, ligados a este navegador y esta computadora; se
pierden si se borran los datos de navegación de este sitio, y no están
disponibles en otro navegador ni en otra máquina.

Estos permisos se pueden revisar o revocar en cualquier momento haciendo clic en
el ícono a la izquierda de la barra de direcciones de Chrome. Si nunca se usan
las funciones de cámara o audio, nunca se pregunta por ellas.

---

## 3. Hacer que reaccione a la música

La app no puede escuchar el sonido de la computadora por sí sola, ya que los
navegadores no tienen permitido escuchar lo que sea que esté sonando. **Se debe
elegir el sistema operativo correspondiente abajo y seguir solo esa sección; no
hace falta leer la otra.**

### Si es una Mac

**¿La música suena en una pestaña de Chrome** (YouTube, Spotify web,
SoundCloud)? Se puede usar la opción rápida, sin nada que instalar:

1. Hacer clic en **System audio**, dentro del panel Audio.
2. En el diálogo de Chrome, elegir la opción **Chrome Tab**, seleccionar la
   pestaña donde suena la música, y marcar **"Share tab audio."**
3. Chrome muestra una barra de "compartiendo" mientras esto está activo; es
   normal, se puede ignorar.

**¿Se está usando un DAW** (Ableton, Logic, etc.)? En Mac, Chrome solo puede
compartir el audio de una pestaña, no el de todo el sistema, así que hace falta
una pequeña herramienta gratuita que enrute el sonido hacia la app:

1. Descargar e instalar **[BlackHole 2ch](https://existential.audio/blackhole/)**
   (gratis; se pide un correo electrónico y envían el enlace de descarga).
2. Abrir la app de Mac **Audio MIDI Setup** (⌘+Espacio, escribir su nombre,
   Enter).
3. Hacer clic en el **+** de la esquina inferior izquierda → **Create
   Multi-Output Device**.
4. En la lista, marcar **ambos**: *BlackHole 2ch* **y** los parlantes o
   interfaz habituales. Marcar ambos es lo que permite seguir *escuchando* la
   música mientras la app también la escucha.
5. En el DAW, configurar la salida de audio (**output**) a ese nuevo
   Multi-Output Device.
6. De vuelta en la app: clic en **Refresh**, elegir **BlackHole**, clic en
   **Start**. Al reproducir algo, los medidores de color deberían moverse.

*Nota: con un Multi-Output Device seleccionado, las teclas de volumen de la Mac
dejan de funcionar. Se debe usar el volumen del DAW o la perilla del propio
parlante.*

### Si es Windows

Esta es la plataforma más simple: **System audio** captura toda la computadora,
DAW incluido, sin nada que instalar.

1. Hacer clic en **System audio**, dentro del panel Audio.
2. En el diálogo de Chrome, elegir **Entire Screen**.
3. Marcar **"Also share system audio"** abajo, y luego clic en **Share**.
4. La app ahora escucha todo lo que reproduce la computadora, incluido el DAW.
   Chrome muestra una barra de "compartiendo" mientras esto está activo; es
   normal, se puede ignorar.

Si se prefiere un cable de audio virtual permanente (sin diálogo cada vez):

1. Descargar e instalar **[VB-CABLE](https://vb-audio.com/Cable/)** (gratis;
   ejecutar el instalador como Administrador y luego reiniciar).
2. En el DAW, configurar la salida de audio (**output**) a **CABLE Input**.
3. Para seguir escuchando la música: abrir **Sound settings** de Windows → *More
   sound settings* → pestaña **Recording** → clic derecho en **CABLE Output** →
   *Properties* → pestaña **Listen** → marcar *Listen to this device* y elegir
   los parlantes.
4. En la app: clic en **Refresh**, elegir **CABLE Output**, clic en **Start**.

*Si VB-CABLE resulta complicado, [VoiceMeeter](https://vb-audio.com/Voicemeeter/)
(también gratis) hace lo mismo con una ventana de mezcla más completa, a costa de
una configuración más larga.*

> **Estado real:** la ruta de Mac/BlackHole está probada y en uso habitual. Las
> instrucciones de Windows siguen configuraciones estándar pero aún no se han
> verificado de primera mano. Si algo no coincide con lo que se ve en pantalla,
> el modo **No sound** sigue funcionando en cualquier máquina.

---

## 4. Las dos vistas: Design vs. Performance

La app tiene dos modos. No se activan manualmente: abrir la ventana de salida
cambia a Performance; cerrarla vuelve a Design.

| | **Vista Design** (por defecto) | **Vista Performance** |
|---|---|---|
| **Cuándo** | Al construir y ajustar looks | Al tocar en vivo frente a público |
| **Diseño** | Vista previa grande a la izquierda, todos los controles a la derecha | Los controles se reducen a una franja angosta para convivir con el DAW; una vista previa pequeña queda en la esquina como monitor |
| **Dónde se ven los visuales** | En la vista previa dentro de la ventana | A pantalla completa en el proyector / segundo monitor |
| **Cómo llegar ahí** | Simplemente abrir la app | Clic en **Open output window →** (arriba a la derecha), arrastrar esa ventana al proyector, presionar **f** para pantalla completa |

Para volver a la vista Design, basta con cerrar la ventana de salida.

---

## 5. Modos de mezcla: cómo se combinan dos visuales

Se pueden correr **dos fuentes a la vez** (Source A y Source B) y elegir cómo se
superponen. El deslizador **Crossfade** funde entre ambas; el menú **Blend**
cambia la *matemática* de cómo se mezclan. Guía rápida en lenguaje simple:

| Blend | Qué hace | Cuándo usarlo… |
|---|---|---|
| **Mix** | Fundido simple: el deslizador va de A a B | Para una mezcla simple, o al usar la luma key (mantener en Mix en ese caso) |
| **Add** | Las suma: todo se aclara, los colores tienden a blanco | Brillos, haces de luz, looks enérgicos y luminosos |
| **Screen** | Aclara con más suavidad: levanta los oscuros sin saturar tan rápido como Add | Superponer una fuente clara sobre una más oscura, con suavidad |
| **Multiply** | Las multiplica: todo se oscurece; solo sobrevive lo que es claro en *ambas* | Teñidos, sombras, oscurecimiento con atmósfera |
| **Difference** | Muestra dónde las dos *difieren*: bordes invertidos, psicodélicos | Looks glitch, alucinógenos, de alto contraste tipo muaré |
| **Lighten** | Conserva, píxel por píxel, la fuente más clara | Dejar que las partes brillantes de cada una se impongan |
| **Darken** | Conserva, píxel por píxel, la fuente más oscura | Dejar que dominen las partes oscuras |
| **Overlay** | Los oscuros se oscurecen más, los claros se aclaran más: sube el contraste | Combinaciones intensas y de alto contraste |

**Consejo:** si se está usando la **luma key** (revelar una fuente a través de
las formas brillantes de otra; por ejemplo, una cámara a través de manchas en
movimiento), conviene mantener **Blend en Mix**. Los modos que aclaran
(Screen/Add) compiten con la key y terminan lavando todo a blanco.

**Otro dato útil:** **Crossfade también funciona como el nivel maestro de la
key.** Con Crossfade en 0, ni el blend ni la key tienen nada que mostrar; el
panel avisa con una pequeña nota si se activa Key mientras Crossfade sigue en 0.

*(Están planificadas miniaturas de antes/después para cada modo de mezcla; eso
explicaría esto más rápido que las palabras.)*

---

## 6. Motion: dejar que el movimiento controle los visuales

Además de la música, la app puede observar algo que *se mueve* y convertir ese
movimiento en su propia señal de control, una segunda forma, independiente, de
moldear los visuales.

1. En el módulo **Motion**, usar **Watch** para elegir qué observa: la
   **Camera**, o un **Video file** cargado (si se elige Video file, el
   movimiento *dentro* del clip es lo que controla, no el movimiento propio).
2. Hacer clic en **Enable**. Si se eligió Camera, esto activa la cámara
   automáticamente.
3. Observar cómo responde el medidor **Motion** a lo que se mueve en cuadro.
   Ajustar **Sensitivity** si se siente demasiado nervioso o demasiado plano
   para la iluminación o el espacio.
4. Más abajo, marcar una fila para **enrutar** el movimiento hacia un parámetro
   (Crossfade, Feedback, Glitch) con un deslizador de profundidad: el
   movimiento ahora empuja ese control, sumado a donde ya esté su propio
   deslizador.

Una buena primera prueba: enrutar Motion hacia **Crossfade**. Quedarse quieto
mantiene Source A; moverse empuja hacia Source B.

---

## 7. Uso cotidiano (versión rápida)

1. Empezar a reproducir la música; los medidores de audio de la app deberían
   moverse. (¿Sin música? Clic en **No sound** y todo sigue animándose.)
2. Elegir **Source A** y **Source B**, y mover **Crossfade** entre ambas.
3. Jugar con **color**, **feedback** y **efectos**; elegir un modo
   **Reactivity** según cuánto se quiere que los visuales reaccionen al ritmo.
4. Configurar el **BPM** (escribiéndolo o marcándolo con Tap) y activar un
   **BPM loop** para movimiento que sigue el tempo.
5. **Guardar** un look que guste en **My presets**: se puede recuperar con su
   botón, con las teclas numéricas **1–8**, o con un pad o tecla MIDI
   aprendida.
6. Al momento de tocar en vivo, **abrir la ventana de salida**, enviarla al
   proyector y pasar a pantalla completa.

**¿Se quiere empezar de nuevo?** Clic en **Reset** (arriba a la derecha, junto a
Open output window) para volver todos los controles de look/efectos a su valor
por defecto. Pide confirmación antes, y deja intactos el tempo, el ajuste de
Quality, los mapeos MIDI y los presets guardados.

> **Los presets de fábrica** están en la lista de pendientes. Por ahora la lista
> de presets empieza vacía: al construir un look que guste y guardarlo, seguirá
> ahí la próxima vez, **en este mismo navegador y esta misma computadora**. Los
> presets no se guardan en ningún servidor, viven únicamente en el
> almacenamiento local de este navegador, así que no acompañan a otro
> navegador, a otra computadora, ni sobreviven si se borran los datos de
> navegación de este sitio.

---

## 8. Si la app se traba (stutter)

Conviene revisar esta lista en orden; los dos primeros puntos resuelven casi
todo.

1. **Bajar el deslizador Quality** (módulo Output) a 60–75%, o 40–50% en un
   proyector 4K. La app renderiza internamente a un tamaño menor y lo escala
   para llenar la pantalla; la imagen se suaviza un poco, pero el movimiento
   se vuelve mucho más fluido.
2. **Conectar la laptop a la corriente.** Con batería, tanto Mac como Windows
   reducen drásticamente la velocidad del chip gráfico. Es la causa más
   frecuente que se pasa por alto.
3. **Cerrar otras pestañas y apps**, especialmente cualquier cosa reproduciendo
   video, y videollamadas.
4. **Bajar el uso de los controles más costosos:** **Feedback** y **Pixelate**
   alto son los que más consumen, y una fuente de cámara o video cuesta más que
   una generativa.

---

## 9. Ejecutar desde una carpeta

Solo hace falta si se recibieron los archivos del proyecto en vez de un enlace
web. Se necesita **[Node.js](https://nodejs.org)** (elegir el botón grande
**LTS** y seguir el instalador).

**Mac:** abrir la app **Terminal**, escribir `cd ` (con un espacio), arrastrar la
carpeta del proyecto sobre la ventana, y presionar Enter. **Windows:** clic
derecho sobre la carpeta y elegir *Open in Terminal*.

Luego escribir estas dos líneas, presionando Enter después de cada una (la
primera solo hace falta la primera vez):

```
npm install
npm run dev
```

Esto muestra una dirección web como `http://localhost:5173`. Se abre esa
dirección en Chrome. Hay que dejar esa ventana abierta mientras se usa la app;
al cerrarla, la app se detiene.
