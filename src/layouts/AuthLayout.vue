<template>
	<div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans antialiased selection:bg-indigo-500 selection:text-white">
		<!-- Efectos de brillo de fondo (Mesh gradients) -->
		<div class="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
		<div class="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/10 blur-[130px] pointer-events-none"></div>
    
		<!-- Patrón de cuadrícula decorativa -->
		<div class="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

		<!-- Contenedor del contenido de autenticación -->
		<div class="w-full max-w-md z-10">
			<slot></slot>
		</div>
	</div>
</template>

<script setup>
// Layout para las vistas de inicio de sesión y registro.
</script>
