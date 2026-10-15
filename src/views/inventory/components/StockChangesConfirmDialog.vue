<template>
	<!-- Grupo propio: el form de pisos ya tiene un ConfirmDialog sin grupo para
	     eliminar colores, y cada uno debe responder solo a su confirm.require(). -->
	<ConfirmDialog :group="STOCK_CHANGES_CONFIRM_GROUP" :pt="{ mask: { class: 'bg-primary/50' } }">
		<template #container="{ message, acceptCallback, rejectCallback }">
			<div class="bg-surface border border-border rounded-md p-5 w-[420px] max-w-[90vw]">
				<h3 class="font-serif text-base text-primary mb-2">{{ message.header }}</h3>
				<p class="text-sm text-text-muted mb-3">{{ message.message }}</p>
				<ul class="text-sm border border-border rounded-md divide-y divide-border mb-5">
					<li
						v-for="(change, index) in message.changes"
						:key="index"
						class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-2"
					>
						<span class="font-medium text-text">{{ change.label }}</span>
						<span class="text-text-muted tabular-nums">{{ change.description }}</span>
					</li>
				</ul>
				<div class="flex items-center justify-end gap-3">
					<button
						type="button"
						@click="rejectCallback"
						class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
					>
						Volver
					</button>
					<button
						type="button"
						@click="acceptCallback"
						class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
					>
						Guardar
					</button>
				</div>
			</div>
		</template>
	</ConfirmDialog>
</template>

<script setup>
import ConfirmDialog from "primevue/confirmdialog";
import { STOCK_CHANGES_CONFIRM_GROUP } from "@/lib/stockChange";
</script>
