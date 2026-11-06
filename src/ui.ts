// Estado de la interfaz que no se guarda
import { reactive } from 'vue'

export const ui = reactive({
  /** El modo cocina oculta la barra inferior mientras se va paso a paso */
  hideTabs: false,
})
