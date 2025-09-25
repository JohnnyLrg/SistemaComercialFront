import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './controller/guards/auth.guard';

export const routes: Routes = [

    {
        path: 'dashboard',
        loadComponent: () => import ('./view/components/principal/principal.component'),
        children: [
            {path: 'home' , loadComponent:() => import('./view/pages/inicio/inicio.component'), title: 'Inicio' },
            {path: 'products' , loadComponent: ()=> import('./view/pages/productos/productos.component'), title: 'Productos' },
            // {path: 'Favorites' , loadComponent: ()=> import('./view/pages/favoritos/favoritos.component'), title: 'Favoritos' },
            {path: 'envios' , loadComponent: () => import('./view/pages/envios/envios.component'), title: 'Pedidos', canActivate: [() => import('./controller/guards/customer-auth.guard').then(m => m.customerAuthGuard)] },
            
            { path: '', redirectTo: '/dashboard/home', pathMatch: 'full' },
            { path: '**', redirectTo: '/dashboard/home', pathMatch: 'full' }
        ]
    },
    {
        path: 'Empresa',
        canActivate: [authGuard],
        loadComponent: ()=> import ('./view/admin/components/principal/principal.component'),
        children: [
            {path: 'home', loadComponent:() => import('./view/admin/pages/inicio/inicio.component'), title: 'Inicio' },
            {path: 'page2', loadComponent:() => import('./view/admin/pages/inventario/inventario.component'), title: 'Inventario' },
            {path: 'clientes', loadComponent:() => import ('./view/admin/pages/clientes/clientes.component'), title: 'Clientes' },
            {path: 'perfil', loadComponent:() => import('./view/shared/Perfil/Perfil.component'),  title: 'Perfil'},
            {path: 'historial', loadComponent:() => import('./view/admin/pages/Historial/Historial.component'), title: 'Historial' },
            {path: 'trabajadores', loadComponent: () => import ('./view/admin/pages/trabajadores/trabajadores.component'), title: 'Trabajadores' },
            {path: 'informes', loadComponent: () => import ('./view/admin/pages/informes/informes.component') , title: 'Informes' },
            {path: 'dashboard-config', loadComponent: () => import('./view/admin/pages/dashboard-config/dashboard-config.component'), title: 'Configuración Dashboard' },
            { path: '', redirectTo: '/Empresa/home', pathMatch: 'full' },
            { path: '**', redirectTo: '/Empresa/home', pathMatch: 'full' }
        ]
    },
    {
        path: 'pedido' ,
        canActivate: [() => import('./controller/guards/customer-auth.guard').then(m => m.customerAuthGuard)],
        loadComponent: () => import ('./view/pages/productos/pedido/pedido.component')
    },
    {
        path: 'login' ,
        canActivate: [publicGuard],
        loadComponent: ()=> import ('./view/components/auth/login/login.component'),
    },
    {
        path: 'register' ,
        canActivate: [publicGuard],
        loadComponent: ()=> import ('./view/components/auth/register/register.component'),
    },
    {
        path: 'customer-login' ,
        canActivate: [() => import('./controller/guards/customer-auth.guard').then(m => m.customerPublicGuard)],
        loadComponent: ()=> import ('./view/components/auth/customer-login/customer-login.component'),
    },
    {
        path: 'customer-register' ,
        canActivate: [() => import('./controller/guards/customer-auth.guard').then(m => m.customerPublicGuard)],
        loadComponent: ()=> import ('./view/components/auth/customer-register/customer-register.component'),
    },
    {
        path: 'customer-profile' ,
        canActivate: [() => import('./controller/guards/customer-auth.guard').then(m => m.customerAuthGuard)],
        loadComponent: ()=> import ('./view/components/auth/customer-profile/customer-profile.component'),
    },
    {
        path: '',
        redirectTo: 'dashboard/home',
        pathMatch: 'full'
    },
    {
        // Redirección en caso de ruta desconocida
        path: '**',
        redirectTo: 'dashboard/home',
        pathMatch: 'full'
    },
];
