import { createApp } from 'vue';
import App from './App.vue';
import VueTippy from 'vue-tippy';
import { createRouter, createWebHistory } from  'vue-router';
import CommitDetails from './CommitDetails';
import CommitsView from './CommitsView';

const routes = [
    {path: '/commits',component: CommitsView},
    {path: '/commits/:sha',component:CommitDetails}
];

const router = createRouter({
    history: createWebHistory(),
    routes,
  })

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

app.use(router);

app.mount('#app');
