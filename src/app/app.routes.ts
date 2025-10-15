import { Routes } from '@angular/router';
// import { AuthGuard } from './auth/guards/auth-guard';
// import { AccessGuard } from './auth/guards/access-guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./shared/pages/home-page/home-page'),
    },
    {
        path: 'login',
        loadComponent: () => import('./auth/pages/login/login'),
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/pages/dashboard-page/dashboard-page'),
        // canActivate: [AuthGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./shared/pages/home-page/home-page'),
            },
            {
                path: 'config',
                // canActivate: [AccessGuard]
                children: [
                    {
                        path: 'roles',
                        loadComponent: () => import('./auth/pages/rol-page/rol-page'),
                    },
                ]
            },
            {
                path: 'tesoreria',
                //loadComponent: () => import('./tesoreria/pages/tesoreria-home/tesoreria-home'),
                // canActivate: [AccessGuard]
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./tesoreria/pages/tesoreria-home/tesoreria-home'),
                    },
                    {
                        path: 'tipo-moneda',
                        loadComponent: () => import('./tesoreria/pages/tipo-moneda-page/tipo-moneda-page'),
                    },
                    {
                        path: 'empresa',
                        loadComponent: () => import('./tesoreria/pages/empresa-page/empresa-page'),
                    },
                ]
            },
            // {
            //     path: 'config',
            //     children: [
            //         {
            //             path: '',
            //             loadComponent: () => import('./configuracion/pages/config-page/config-page'),
            //             // canActivate: [AccessGuard]
            //         },
            //         {
            //             path: 'config',
            //             loadComponent: () => import('./configuracion/pages/configuraciones-page/configuraciones-page.component'),
            //             canActivate: [AccessGuard]
            //         },
            //         {
            //             path: 'user',
            //             loadComponent: () => import('./configuracion/pages/user-page/user-page'),
            //             canActivate: [AccessGuard]
            //         },
            //         {
            //             path: 'users',
            //             loadComponent: () => import('./configuracion/pages/users-page/users-page'),
            //             canActivate: [AccessGuard]
            //         },
            //         {
            //             path: 'roles',
            //             loadComponent: () => import('./configuracion/pages/rol-page/rol-page'),
            //             canActivate: [AccessGuard]
            //         },
            //         {
            //             path: 'metodos',
            //             loadComponent: () => import('./configuracion/pages/metodos-auth-page/metodos-auth-page.component'),
            //             canActivate: [AccessGuard]
            //         },
            //         {
            //             path: 'menus',
            //             loadComponent: () => import('./configuracion/pages/menu-page/menu-page.component'),
            //             canActivate: [AccessGuard]
            //         },
            //         {
            //             path: 'accesos',
            //             loadComponent: () => import('./configuracion/pages/acceso-page/acceso-page.component'),
            //             canActivate: [AccessGuard]
            //         }
            //     ]
            // },
            // {
            //     path: 'reportes',
            //     children: [
            //         {
            //             path: '',
            //             loadComponent: () => import('./reportes/pages/home-reporte/home-reporte.component'),
            //         }
            //     ]
            // },
        ]
    },
    {
        path: '404',
        loadComponent: () => import('./shared/pages/404-page/404-page'),
    },
    {
        path: '401',
        loadComponent: () => import('./shared/pages/401-page/401-page'),
    },
    {
        path: '**',
        loadComponent: () => import('./shared/pages/404-page/404-page'),
    }


];
