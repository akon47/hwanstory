import {createWebHashHistory, createRouter} from "vue-router";

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: "/",
            redirect: "/main",
        },
        {
            path: "/main",
            name: "Main",
            component: () => import("../views/MainView.vue"),
        },
        {
            path: "/signup",
            name: "Signup",
            component: () => import("../views/SignupView.vue"),
        },
        {
            path: "/signin",
            name: "Signin",
            component: () => import("../views/SigninView.vue"),
        },
        {
            path: "/not-found",
            name: "NotFound",
            component: () => import("../views/NotFoundView.vue"),
        },
        {
            path: "/:pathMatch(.*)*",
            redirect: "not-found",
        },
    ],
});

export default router;