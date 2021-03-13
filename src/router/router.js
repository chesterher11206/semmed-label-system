import Vue from 'vue'
import Router from 'vue-router'

// Components
import nav from '../components/nav.vue';
import login from '../components/login.vue'
import query from '../components/query.vue';
import label from '../components/label.vue';
import { casePage } from '../components/label/case';
import { detailPage } from '../components/label/detail';

Vue.use(Router);

var router = new Router({
    mode: 'history',
    scrollBehavior () {
        return { x: 0, y: 0 };
    },
    routes: [
        {
            path: '/',
            name: 'home',
            component: nav,
            redirect: '/label',
            meta: {
                requiresAuth: true
            },
            children: [
                {
                    path: '/query',
                    name: 'query',
                    component: query,
                },
                {
                    path: '/label',
                    name: 'label',
                    component: label,
                    redirect: '/label/case',
                    children: [
                        {
                            path: 'case',
                            name: 'case',
                            component: casePage
                        },
                        {
                            path: 'detail',
                            name: 'detail',
                            component: detailPage
                        }
                    ]
                }
            ]
        },
        {
            path: '/login',
            name: 'login',
            component: login,
        }
    ]
});

router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (localStorage.getItem('jwt') == null) {
            next({
                path: '/login',
                query: { nextUrl: to.fullPath }
            });
        }
        else {
            next();
        }
    }
    else {
        if (to.name == 'login' & localStorage.getItem('jwt') != null) {
            next({
                path: '/'
            });
        }
        else {
            next();
        }
    }
});

export default router;