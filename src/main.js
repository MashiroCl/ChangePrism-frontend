import { createApp } from 'vue';
import App from './App.vue';
import VueTippy from 'vue-tippy'

const app = createApp(App);
app.use(  VueTippy,
    // optional
    {
      directive: 'tippy', // => v-tippy
      component: 'tippy', // => <tippy/>
      componentSingleton: 'tippy-singleton', // => <tippy-singleton/>,
      defaultProps: {
        placement: 'auto-end',
        allowHTML: true,
      }, // => Global default options * see all props
    });
app.mount('#app');