<template>
	<label :for="htmlFor" class="text-xs font-medium text-text-muted block">
		{{ text }}<span v-if="required" class="text-danger ml-0.5">*</span>
	</label>
</template>

<script setup>
// Label estándar de los forms. `required` solo agrega el asterisco visual; la
// validación real sigue en el backend.
defineProps({
	htmlFor: { type: String, required: true },
	text: { type: String, required: true },
	required: { type: Boolean, default: false },
})
</script>

<style scoped>

</style>
