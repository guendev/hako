// 1. Define route components.
// These can be imported from other files
import {createRouter, createWebHistory} from "vue-router"

// 2. Define some routes
// Each route should map to a component.
// We'll talk about nested routes later.
const routes = [
    { path: '/', component: () => import('../pages/index.vue') },
    { path: '/apps', component: () => import('../pages/apps/index.vue') },
    { path: '/loading', component: () => import('../pages/loading/index.vue') },
    { path: '/spotlight', component: () => import('../pages/spotlight/index.vue') },
]

// 3. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
export const router = createRouter({
    // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
    history: createWebHistory(),
    routes, // short for `routes: routes`
})
