<template>
    <div class="p-2 max-w-4xl">
        <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
                <h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
                <p class="text-sm text-text-muted mt-0.5">
                    {{
                        isEditMode
                            ? "Modifica los datos de la línea, sus medidas, precios y colores. El stock se ajusta desde Inventario."
                            : "Registra una línea de piso con sus medidas, precios y colores. Puedes agregar más medidas y colores después."
                    }}
                </p>
            </div>
            <button
                type="button"
                @click="handleCancel"
                class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-1.5 shrink-0"
            >
                <i class="ti ti-arrow-left text-sm"></i>
                Volver
            </button>
        </div>

        <p
            v-if="generalError"
            class="text-danger text-[13px] mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
        >
            <svg
                class="w-3.5 h-3.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
            </svg>
            {{ generalError }}
        </p>

        <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Sección 1 — Datos del producto (línea) -->
            <div class="bg-surface border border-border rounded-md p-5 sm:p-6">
                <h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">
                    Datos del producto (línea)
                </h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <FieldLabel html-for="supplier_id" text="Proveedor" required />
                        <!-- Igual que Categoría: crear el proveedor aquí evita salir del
						     formulario. Solo con el catálogo cargado (ver SuppliersSettingsView). -->
                        <div class="flex gap-2">
                            <div class="flex-1 min-w-0">
                                <SelectCustom
                                    id="supplier_id"
                                    v-model="form.supplier_id"
                                    :options="catalogs.suppliers"
                                    :loading="catalogs.loading"
                                    :error="errors.supplier_id"
                                    placeholder="Selecciona un proveedor"
                                    @change="errors.supplier_id = ''"
                                />
                            </div>
                            <button
                                type="button"
                                class="shrink-0 inline-flex items-center justify-center h-10 w-10 bg-surface border border-border hover:bg-bg text-text-muted hover:text-text rounded-md transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                aria-label="Nuevo proveedor"
                                title="Nuevo proveedor"
                                :disabled="!catalogs.initialized"
                                @click="supplierDialogVisible = true"
                            >
                                <i class="ti ti-plus text-base" aria-hidden="true"></i>
                            </button>
                        </div>
                        <p v-if="errors.supplier_id" class="text-danger text-[12px] mt-1.5">
                            {{ errors.supplier_id }}
                        </p>
                    </div>

                    <div class="space-y-1.5">
                        <FieldLabel html-for="category_id" text="Categoría" required />
                        <!-- Crear la categoría aquí evita salir del formulario y perder lo
						     capturado. Solo con el catálogo cargado (ver CategoriesSettingsView). -->
                        <div class="flex gap-2">
                            <div class="flex-1 min-w-0">
                                <SelectCustom
                                    id="category_id"
                                    v-model="form.category_id"
                                    :options="variantCategories"
                                    :loading="catalogs.loading"
                                    :error="errors.category_id"
                                    placeholder="Selecciona una categoría"
                                    empty-message="No hay categorías de tipo Pisos"
                                    @change="errors.category_id = ''"
                                />
                            </div>
                            <button
                                type="button"
                                class="shrink-0 inline-flex items-center justify-center h-10 w-10 bg-surface border border-border hover:bg-bg text-text-muted hover:text-text rounded-md transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                aria-label="Nueva categoría"
                                title="Nueva categoría"
                                :disabled="!catalogs.initialized"
                                @click="categoryDialogVisible = true"
                            >
                                <i class="ti ti-plus text-base" aria-hidden="true"></i>
                            </button>
                        </div>
                        <p v-if="errors.category_id" class="text-danger text-[12px] mt-1.5">
                            {{ errors.category_id }}
                        </p>
                    </div>

                    <div class="space-y-1.5">
                        <FieldLabel html-for="name" text="Nombre" required />
                        <InputTextCustom
                            id="name"
                            v-model="form.name"
                            :error="errors.name"
                            placeholder="Ej. Porcelanato Carrara"
                            @input="errors.name = ''"
                        />
                        <p v-if="errors.name" class="text-danger text-[12px] mt-1.5">
                            {{ errors.name }}
                        </p>
                    </div>

                    <div class="space-y-1.5">
                        <FieldLabel html-for="unit_type_id" text="Unidad" required />
                        <SelectCustom
                            id="unit_type_id"
                            v-model="form.unit_type_id"
                            :options="catalogs.unitTypes"
                            :loading="catalogs.loading"
                            :disabled="hasSavedVariants"
                            :error="errors.unit_type_id"
                            placeholder="Selecciona una unidad"
                            @change="errors.unit_type_id = ''"
                        />
                        <p v-if="errors.unit_type_id" class="text-danger text-[12px] mt-1.5">
                            {{ errors.unit_type_id }}
                        </p>
                        <!-- Mismo bloqueo que el backend (Product::unitTypeChangeBlockedMessage). -->
                        <p v-else-if="hasSavedVariants" class="text-xs text-text-muted mt-1.5">
                            No se puede cambiar si el producto ya tiene variantes registradas.
                        </p>
                    </div>

                    <div class="space-y-1.5">
                        <FieldLabel html-for="purchase_unit" text="Unidad de compra" required />
                        <InputTextCustom
                            id="purchase_unit"
                            v-model="form.purchase_unit"
                            :error="errors.purchase_unit"
                            placeholder="Ej. Caja"
                            @input="errors.purchase_unit = ''"
                        />
                        <p v-if="errors.purchase_unit" class="text-danger text-[12px] mt-1.5">
                            {{ errors.purchase_unit }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Sección 2 — Una tarjeta por medida: su ficha técnica + sus colores -->
            <div
                v-for="(group, index) in variantGroups"
                :key="group.id"
                class="bg-surface border border-border rounded-md p-5 sm:p-6"
            >
                <div class="flex items-center justify-between gap-3 mb-4">
                    <!-- Mismo criterio que el encabezado de cada medida en InventoryTable.vue:
					     la medida sola no basta (puede repetirse con otro PEI/ETT/precio). -->
                    <h2 class="flex flex-wrap items-center gap-2 text-sm">
                        <span class="font-medium text-text">
                            {{ group.spec.size || `Medida nueva ${index + 1}` }}
                        </span>
                        <span
                            v-if="group.spec.pei"
                            class="text-xs text-text-muted border border-border rounded px-1.5 py-0.5"
                        >PEI {{ group.spec.pei }}</span
                        >
                        <span
                            v-if="group.spec.ett"
                            class="text-xs text-text-muted border border-border rounded px-1.5 py-0.5"
                        >ETT {{ group.spec.ett }}</span
                        >
                        <span
                            v-if="group.spec.price_per_box !== null && group.spec.price_per_box !== ''"
                            class="font-semibold text-primary tabular-nums"
                        >{{ formatCurrency(group.spec.price_per_box) }}/{{ soldByPiece ? "pieza" : "caja" }}</span
                        >
                        <span class="text-xs text-text-muted">
                            · {{ group.colorRows.length }}
                            {{ group.colorRows.length === 1 ? "color" : "colores" }}
                        </span>
                    </h2>
                    <!-- Solo medidas sin variantes guardadas: quitar una guardada sería
					     borrar variantes, fuera del alcance de este form. -->
                    <button
                        v-if="canRemoveGroup(group)"
                        type="button"
                        @click="removeVariantGroup(group.id)"
                        class="text-xs text-text-muted hover:text-danger underline transition-colors cursor-pointer"
                    >
                        Quitar medida
                    </button>
                </div>

                <!-- Grupo 1 — Medida y especificaciones técnicas. PEI/ETT no aplican
				     a pisos por pieza (el backend los rechaza). -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="space-y-1.5">
                        <FieldLabel :html-for="`size-${group.id}`" text="Medida" required />
                        <InputTextCustom
                            :id="`size-${group.id}`"
                            v-model="group.spec.size"
                            :error="group.specErrors.size"
                            placeholder="Ej. 60X120"
                            @input="group.specErrors.size = ''"
                        />
                        <p v-if="group.specErrors.size" class="text-danger text-[12px] mt-1.5">
                            {{ group.specErrors.size }}
                        </p>
                    </div>

                    <div v-if="!soldByPiece" class="space-y-1.5">
                        <FieldLabel :html-for="`pei-${group.id}`" text="PEI" />
                        <SelectCustom
                            :id="`pei-${group.id}`"
                            v-model="group.spec.pei"
                            :options="peiOptions"
                            keep-unknown-value
                            :error="group.specErrors.pei"
                            placeholder="Selecciona un PEI"
                            @change="group.specErrors.pei = ''"
                        />
                        <p v-if="group.specErrors.pei" class="text-danger text-[12px] mt-1.5">
                            {{ group.specErrors.pei }}
                        </p>
                    </div>

                    <div v-if="!soldByPiece" class="space-y-1.5">
                        <FieldLabel :html-for="`ett-${group.id}`" text="ETT" />
                        <InputTextCustom
                            :id="`ett-${group.id}`"
                            v-model="group.spec.ett"
                            :error="group.specErrors.ett"
                            placeholder="Ej. 1"
                            @input="group.specErrors.ett = ''"
                        />
                        <p v-if="group.specErrors.ett" class="text-danger text-[12px] mt-1.5">
                            {{ group.specErrors.ett }}
                        </p>
                    </div>
                </div>

                <!-- Grupo 3 — Precio. Pisos por pieza: un solo precio, el de la pieza,
				     que viaja como price_per_box (no llevan precio por m²). -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 border-t border-border pt-4">
                    <div class="space-y-1.5">
                        <FieldLabel
                            :html-for="`price_per_box-${group.id}`"
                            :text="soldByPiece ? 'Precio por pieza' : 'Precio por caja'"
                            required
                        />
                        <InputNumberCustom
                            :id="`price_per_box-${group.id}`"
                            v-model="group.spec.price_per_box"
                            :error="group.specErrors.price_per_box"
                            :min="0"
                            placeholder="$0.00"
                            @input="group.specErrors.price_per_box = ''"
                            mode="currency"
                            currency="MXN"
                        />
                        <p
                            v-if="group.specErrors.price_per_box"
                            class="text-danger text-[12px] mt-1.5"
                        >
                            {{ group.specErrors.price_per_box }}
                        </p>
                    </div>

                    <div v-if="!soldByPiece" class="space-y-1.5">
                        <FieldLabel :html-for="`price_per_m2-${group.id}`" text="Precio por m²" required />
                        <InputNumberCustom
                            :id="`price_per_m2-${group.id}`"
                            v-model="group.spec.price_per_m2"
                            :error="group.specErrors.price_per_m2"
                            :min="0"
                            placeholder="$0.00"
                            @input="group.specErrors.price_per_m2 = ''"
                            mode="currency"
                            currency="MXN"
                        />
                        <p v-if="group.specErrors.price_per_m2" class="text-danger text-[12px] mt-1.5">
                            {{ group.specErrors.price_per_m2 }}
                        </p>
                    </div>
                </div>

                <!-- Grupo 2 — Datos por caja. No aplica a pisos por pieza: piezas, m²,
				     kilos y cajas por tarima son empaque/logística de caja. -->
                <div v-if="!soldByPiece" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div class="space-y-1.5">
                        <FieldLabel :html-for="`pieces_per_box-${group.id}`" text="Piezas por caja" required />
                        <InputNumberCustom
                            :id="`pieces_per_box-${group.id}`"
                            v-model="group.spec.pieces_per_box"
                            :error="group.specErrors.pieces_per_box"
                            :min="0"
                            placeholder="0"
                            @input="group.specErrors.pieces_per_box = ''"
                            :max-fraction-digits="0"
                        />
                        <p
                            v-if="group.specErrors.pieces_per_box"
                            class="text-danger text-[12px] mt-1.5"
                        >
                            {{ group.specErrors.pieces_per_box }}
                        </p>
                    </div>

                    <div class="space-y-1.5">
                        <FieldLabel :html-for="`kilos_per_box-${group.id}`" text="Kilos por caja" />
                        <InputNumberCustom
                            :id="`kilos_per_box-${group.id}`"
                            v-model="group.spec.kilos_per_box"
                            :error="group.specErrors.kilos_per_box"
                            :min="0"
                            placeholder="0.00"
                            @input="group.specErrors.kilos_per_box = ''"
                            :max-fraction-digits="2"
                        />
                        <p
                            v-if="group.specErrors.kilos_per_box"
                            class="text-danger text-[12px] mt-1.5"
                        >
                            {{ group.specErrors.kilos_per_box }}
                        </p>
                    </div>

                    <div class="space-y-1.5">
                        <FieldLabel :html-for="`m2_per_box-${group.id}`" text="m² por caja" required />
                        <InputNumberCustom
                            :id="`m2_per_box-${group.id}`"
                            v-model="group.spec.m2_per_box"
                            :error="group.specErrors.m2_per_box"
                            :min="0"
                            placeholder="0.00"
                            @input="group.specErrors.m2_per_box = ''"
                            :max-fraction-digits="2"
                        />
                        <p v-if="group.specErrors.m2_per_box" class="text-danger text-[12px] mt-1.5">
                            {{ group.specErrors.m2_per_box }}
                        </p>
                    </div>

                    <div class="space-y-1.5">
                        <FieldLabel :html-for="`boxes_per_pallet-${group.id}`" text="Cajas por tarima" />
                        <InputNumberCustom
                            :id="`boxes_per_pallet-${group.id}`"
                            v-model="group.spec.boxes_per_pallet"
                            :error="group.specErrors.boxes_per_pallet"
                            :min="0"
                            placeholder="0"
                            @input="group.specErrors.boxes_per_pallet = ''"
                            :max-fraction-digits="0"
                        />
                        <p
                            v-if="group.specErrors.boxes_per_pallet"
                            class="text-danger text-[12px] mt-1.5"
                        >
                            {{ group.specErrors.boxes_per_pallet }}
                        </p>
                    </div>
                </div>

                <!-- Grupo 4 — Dato interno del negocio, separado del resto (no viene de la hoja del proveedor) -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                    <div class="space-y-1.5">
                        <FieldLabel
                            :html-for="`commission_category_id-${group.id}`"
                            text="Categoría de comisión"
                        />
                        <SelectCustom
                            :id="`commission_category_id-${group.id}`"
                            v-model="group.spec.commission_category_id"
                            :options="catalogs.commissionCategories"
                            option-label="code"
                            :loading="catalogs.loading"
                            :error="group.specErrors.commission_category_id"
                            placeholder="Sin categoría"
                            allow-empty
                            @change="group.specErrors.commission_category_id = ''"
                        />
                        <p
                            v-if="group.specErrors.commission_category_id"
                            class="text-danger text-[12px] mt-1.5"
                        >
                            {{ group.specErrors.commission_category_id }}
                        </p>
                    </div>
                </div>

                <!-- Colores — lista repetible: cada fila se convierte en su propia variante -->
                <div class="mt-6">
                    <h3
                        class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-3"
                    >
                        Colores
                    </h3>

                    <!-- Tabla compacta: encabezado una vez y una fila delgada por color. Por
					     debajo de sm cada fila apila sus 3 campos con su label visible; desde
					     sm los labels pasan a sr-only (siguen asociados al input) y el
					     encabezado de columnas toma su lugar. Header y filas comparten la
					     misma estructura (grid de 3 columnas + hueco del botón) para alinear. -->
                    <!-- `relative`: los labels `sm:sr-only` son `position: absolute`; sin un
					     ancestro posicionado se ubican contra el documento, escapan del scroll
					     de <main> (AppLayout) y alargan el <body>, descuadrando el layout. -->
                    <div class="relative border border-border rounded-md overflow-hidden">
                        <div
                            class="hidden sm:flex items-center gap-2 bg-bg border-b border-border px-3 py-2"
                            aria-hidden="true"
                        >
                            <div
                                class="flex-1 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 text-xs font-medium uppercase tracking-wide text-text-muted"
                            >
                                <span>Color<span class="text-danger ml-0.5">*</span></span>
                                <span>Stock ({{ stockUnit.label }})</span>
                                <span>Stock mínimo</span>
                            </div>
                            <span class="w-8 shrink-0"></span>
                        </div>

                        <div class="divide-y divide-border">
                            <div
                                v-for="row in group.colorRows"
                                :key="row.id"
                                class="flex items-start gap-2 px-3 py-3 sm:py-2"
                            >
                                <div
                                    class="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3"
                                >
                                    <div class="space-y-1.5 sm:space-y-0">
                                        <FieldLabel
                                            :html-for="`color-${row.id}`"
                                            text="Color"
                                            required
                                            class="sm:sr-only"
                                        />
                                        <InputTextCustom
                                            :id="`color-${row.id}`"
                                            v-model="row.color"
                                            :error="row.errors.color"
                                            placeholder="Ej. Blanco"
                                            @input="row.errors.color = ''"
                                        />
                                        <p v-if="row.errors.color" class="text-danger text-xs mt-1.5">
                                            {{ row.errors.color }}
                                        </p>
                                    </div>

                                    <!-- Mismo campo para colores nuevos (stock inicial) y existentes:
									     en uno existente el cambio se aplica al guardar como ajuste
									     con historial (ver applyStockChanges). Vacío = sin control. -->
                                    <div class="space-y-1.5 sm:space-y-0">
                                        <FieldLabel
                                            :html-for="`stock_boxes-${row.id}`"
                                            :text="`${row.variantId ? 'Stock actual' : 'Stock inicial'} (${stockUnit.label})`"
                                            class="sm:sr-only"
                                        />
                                        <InputNumberCustom
                                            :id="`stock_boxes-${row.id}`"
                                            v-model="row.stock_boxes"
                                            :error="row.errors.stock_boxes"
                                            :min="0"
                                            placeholder="Sin control"
                                            @input="row.errors.stock_boxes = ''"
                                            :max-fraction-digits="0"
                                        />
                                        <p v-if="row.errors.stock_boxes" class="text-danger text-xs mt-1.5">
                                            {{ row.errors.stock_boxes }}
                                        </p>
                                        <p
                                            v-else-if="row.variantId && stockChangePayload(row.originalStock, row.stock_boxes)"
                                            class="text-text-muted text-xs mt-1.5"
                                        >
                                            {{ describeStockChange(row.originalStock, row.stock_boxes, stockUnit.short) }}
                                        </p>
                                    </div>

                                    <div class="space-y-1.5 sm:space-y-0">
                                        <FieldLabel
                                            :html-for="`minimum_stock-${row.id}`"
                                            text="Stock mínimo"
                                            class="sm:sr-only"
                                        />
                                        <InputNumberCustom
                                            :id="`minimum_stock-${row.id}`"
                                            v-model="row.minimum_stock"
                                            :error="row.errors.minimum_stock"
                                            :min="0"
                                            placeholder="0"
                                            @input="row.errors.minimum_stock = ''"
                                            :max-fraction-digits="0"
                                        />
                                        <p v-if="row.errors.minimum_stock" class="text-danger text-xs mt-1.5">
                                            {{ row.errors.minimum_stock }}
                                        </p>
                                    </div>
                                </div>

                                <!-- Mismo alto que los inputs para quedar centrado con ellos desde sm -->
                                <button
                                    type="button"
                                    @click="removeColorRow(group, row.id)"
                                    :disabled="group.colorRows.length === 1 || deletingRowId === row.id"
                                    class="w-8 h-10 shrink-0 flex items-center justify-center rounded text-text-muted hover:text-danger disabled:opacity-30 disabled:hover:text-text-muted disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    :aria-label="row.color ? `Eliminar color ${row.color}` : 'Eliminar color'"
                                    title="Eliminar color"
                                >
                                    <svg
                                        class="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        aria-hidden="true"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M6 6l12 12M6 18L18 6"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        @click="addColorRow(group)"
                        class="mt-3 w-full border border-dashed border-border rounded-md py-2 text-sm text-text-muted hover:text-text hover:border-accent transition-colors select-none cursor-pointer"
                    >
                        + Agregar color
                    </button>
                </div>
            </div>

            <button
                type="button"
                @click="addVariantGroup"
                class="w-full border border-dashed border-border rounded-md py-3 text-sm text-text-muted hover:text-text hover:border-accent bg-surface transition-colors select-none cursor-pointer"
            >
                + Agregar medida
            </button>

            <!-- Acciones -->
            <div class="flex items-center justify-end gap-3">
                <button
                    type="button"
                    @click="handleCancel"
                    class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    :disabled="submitting || loadingProduct"
                    class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                >
                    {{
                        submitting
                            ? "Guardando…"
                            : isEditMode
                                ? "Guardar cambios"
                                : "Guardar producto"
                    }}
                </button>
            </div>
        </form>

        <StockChangesConfirmDialog />

        <SupplierFormDialog
            v-model:visible="supplierDialogVisible"
            from-product-form
            @saved="onSupplierCreated"
        />

        <CategoryFormDialog
            v-model:visible="categoryDialogVisible"
            fixed-product-form-type="variant"
            @saved="onCategoryCreated"
        />

        <ConfirmDialog :pt="{ mask: { class: 'bg-primary/50' } }">
            <template #container="{ message, acceptCallback, rejectCallback }">
                <div class="bg-surface border border-border rounded-md p-5 w-[380px] max-w-[90vw]">
                    <h3 class="font-serif text-base text-primary mb-2">{{ message.header }}</h3>
                    <p class="text-sm text-text-muted mb-5">{{ message.message }}</p>
                    <div class="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            @click="rejectCallback"
                            class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            @click="acceptCallback"
                            class="bg-danger hover:bg-danger/90 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </template>
        </ConfirmDialog>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import axios from "@/lib/axios";
import SelectCustom from "@/components/widgets/SelectCustom.vue";
import { useCatalogsStore } from "@/stores/catalogs";
import { useInventoryStore } from "@/stores/inventory";
import InputTextCustom from "@/components/widgets/InputTextCustom.vue";
import InputNumberCustom from "@/components/widgets/InputNumberCustom.vue";
import FieldLabel from "@/components/widgets/labels/FieldLabel.vue";
import { groupVariants } from "@/lib/groupVariants";
import { formatCurrency } from "@/lib/formatCurrency";
import { confirmStockChanges, describeStockChange, stockChangePayload } from "@/lib/stockChange";
import { isSoldByPiece, variantStockUnit } from "@/lib/unitTypes";
import StockChangesConfirmDialog from "./components/StockChangesConfirmDialog.vue";
import CategoryFormDialog from "@/components/widgets/dialogs/CategoryFormDialog.vue";
import SupplierFormDialog from "@/components/widgets/dialogs/SupplierFormDialog.vue";

const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const catalogs = useCatalogsStore();
const inventory = useInventoryStore();

// Las categorías de tipo 'simple' son de "Otros productos"; aquí solo las de pisos.
const variantCategories = computed(() =>
    catalogs.categories.filter((c) => c.product_form_type === "variant"),
);

const supplierDialogVisible = ref(false);

// El proveedor recién creado queda seleccionado: es para lo que se abrió el diálogo.
function onSupplierCreated(supplier) {
    form.supplier_id = supplier.id;
    errors.supplier_id = "";
}

const categoryDialogVisible = ref(false);

// La categoría recién creada queda seleccionada: es para lo que se abrió el diálogo.
function onCategoryCreated(category) {
    form.category_id = category.id;
    errors.category_id = "";
}

const isEditMode = computed(() => !!route.params.id);
const loadingProduct = ref(false);

onMounted(() => {
    if (!catalogs.initialized) catalogs.fetchCatalogs();
    if (isEditMode.value) fetchProduct();
});

const peiOptions = ["I", "II", "III", "IV", "V"];

const form = reactive({
    supplier_id: "",
    category_id: "",
    unit_type_id: "",
    name: "",
    purchase_unit: "",
});

// Se recalcula al cambiar el selector de Unidad, en creación y en edición.
const selectedUnitTypeName = computed(
    () => catalogs.unitTypes.find((unitType) => unitType.id === form.unit_type_id)?.name ?? null,
);
const soldByPiece = computed(() => isSoldByPiece(selectedUnitTypeName.value));
const stockUnit = computed(() => variantStockUnit(selectedUnitTypeName.value));

// Campos de variante que no aplican a pisos por pieza: no se muestran, no se
// validan y no viajan en el payload (el backend rechaza los de m²/PEI/ETT).
const pieceExcludedVariantFields = [
    "pei",
    "ett",
    "price_per_m2",
    "m2_per_box",
    "kilos_per_box",
    "boxes_per_pallet",
    "pieces_per_box",
];

const errors = reactive({
    supplier_id: "",
    category_id: "",
    unit_type_id: "",
    name: "",
    purchase_unit: "",
});

// Cada fila se convierte en su propia variante (POST/PUT /api/product-variants). `id` es
// solo la key local para el v-for; `variantId` es el id real en backend (null si la fila
// es nueva en esta sesión de edición) y decide POST vs. PUT al guardar.
// `originalStock` es el stock con el que se cargó la variante: contra él se
// calcula el ajuste al guardar.
function createColorRow({
    variantId = null,
    color = "",
    stock_boxes = null,
    minimum_stock = null,
} = {}) {
    return {
        id: crypto.randomUUID(),
        variantId,
        color,
        stock_boxes,
        originalStock: stock_boxes,
        minimum_stock,
        errors: { color: "", stock_boxes: "", minimum_stock: "" },
    };
}

// Un grupo = una medida del producto: su ficha técnica (`spec`) + los colores que la
// comparten. Mismo criterio de agrupamiento que groupVariants.js / InventoryTable.vue,
// así que en edición el form muestra exactamente los grupos que se ven en Inventario.
// En creación se arranca con un solo grupo vacío (mismo comportamiento que antes).
const specFields = [
    "size",
    "pei",
    "ett",
    "kilos_per_box",
    "boxes_per_pallet",
    "commission_category_id",
    "price_per_box",
    "price_per_m2",
    "pieces_per_box",
    "m2_per_box",
];

function createVariantGroup({ spec = {}, colorRows = [createColorRow()] } = {}) {
    return {
        id: crypto.randomUUID(),
        spec: {
            size: "",
            pei: "",
            ett: "",
            kilos_per_box: null,
            boxes_per_pallet: null,
            commission_category_id: "",
            price_per_box: null,
            price_per_m2: null,
            pieces_per_box: null,
            m2_per_box: null,
            ...spec,
        },
        specErrors: Object.fromEntries(specFields.map((field) => [field, ""])),
        colorRows,
    };
}

const variantGroups = ref([createVariantGroup()]);

// Solo en edición hay filas con `variantId`. Con variantes guardadas la Unidad
// no se puede cambiar (el backend lo rechaza), así que el selector se bloquea.
const hasSavedVariants = computed(() =>
    variantGroups.value.some((group) => group.colorRows.some((row) => row.variantId)),
);

function addVariantGroup() {
    variantGroups.value.push(createVariantGroup());
}

// Mismo criterio que colores nuevos vs. existentes: un grupo solo se quita si
// ninguna de sus filas existe ya como variante en backend. Siempre queda al menos uno.
function canRemoveGroup(group) {
    return variantGroups.value.length > 1 && group.colorRows.every((row) => !row.variantId);
}

function removeVariantGroup(groupId) {
    const group = variantGroups.value.find((g) => g.id === groupId);
    if (!group || !canRemoveGroup(group)) return;
    variantGroups.value = variantGroups.value.filter((g) => g.id !== groupId);
}
const deletingRowId = ref(null);

function addColorRow(group) {
    group.colorRows.push(createColorRow());
}

// Filas sin `variantId` son nuevas en esta sesión (o el flujo de creación, donde
// ninguna fila lo tiene) — se quitan del array local sin tocar el backend. Filas con
// `variantId` ya existen como variante real, así que requieren confirmación y un
// DELETE inmediato (no esperan al submit del form). El mínimo de 1 color aplica por
// grupo: quitar el último color de una medida no se permite desde aquí.
function removeColorRow(group, rowId) {
    if (group.colorRows.length === 1) return;

    const row = group.colorRows.find((r) => r.id === rowId);
    if (!row) return;

    if (!row.variantId) {
        group.colorRows = group.colorRows.filter((r) => r.id !== rowId);
        return;
    }

    confirm.require({
        header: "Eliminar variante",
        message: `¿Eliminar el color "${row.color}"? Esta acción no se puede deshacer.`,
        accept: () => deleteVariantRow(group, row),
    });
}

async function deleteVariantRow(group, row) {
    deletingRowId.value = row.id;
    generalError.value = null;

    try {
        await axios.delete(`/api/product-variants/${row.variantId}`);
        group.colorRows = group.colorRows.filter((r) => r.id !== row.id);
    } catch (err) {
        if (err.response?.status === 422) {
            generalError.value = err.response.data.message;
        } else {
            generalError.value = "No se pudo eliminar la variante. Intenta de nuevo.";
        }
    } finally {
        deletingRowId.value = null;
    }
}

// Agrupa las variantes con groupVariants.js (medida+PEI+ETT+categoría de comisión+
// precio por caja). Los campos que no son parte de la llave (piezas, m², kg, cajas por
// tarima, precio por m²) se toman de la primera variante del grupo, igual que el
// encabezado de cada medida en InventoryTable.vue.
function populateFormFromProduct(product) {
    form.supplier_id = product.supplier_id;
    form.category_id = product.category_id;
    form.unit_type_id = product.unit_type_id;
    form.name = product.name;
    form.purchase_unit = product.purchase_unit;

    const groups = groupVariants(product.variants ?? []);
    if (!groups.length) return;

    variantGroups.value = groups.map((group) =>
        createVariantGroup({
            spec: {
                size: group.size,
                pei: group.pei,
                // El backend lo manda como entero; el input de ETT es de texto
                // (igual que al capturarlo en un producto nuevo).
                ett: group.ett === null ? "" : String(group.ett),
                kilos_per_box: group.kilos_per_box,
                boxes_per_pallet: group.boxes_per_pallet,
                commission_category_id: group.commission_category?.id ?? "",
                price_per_box: group.price_per_box,
                price_per_m2: group.price_per_m2,
                pieces_per_box: group.pieces_per_box,
                m2_per_box: group.m2_per_box,
            },
            colorRows: group.variants.map((v) =>
                createColorRow({
                    variantId: v.id,
                    color: v.color,
                    stock_boxes: v.stock_boxes,
                    minimum_stock: v.minimum_stock,
                }),
            ),
        }),
    );
}

async function fetchProduct() {
    loadingProduct.value = true;

    try {
        const { data } = await axios.get(`/api/products/${route.params.id}`, {
            params: { with: "variants" },
        });
        populateFormFromProduct(data.data);
    } catch (err) {
        console.error(err);
        generalError.value = "No se pudo cargar el producto.";
    } finally {
        loadingProduct.value = false;
    }
}

const requiredFormFields = ["supplier_id", "category_id", "unit_type_id", "name", "purchase_unit"];
const requiredVariantFields = [
    "size",
    "price_per_box",
    "price_per_m2",
    "pieces_per_box",
    "m2_per_box",
];
const requiredColorRowFields = ["color"];

const validateForm = () => {
    let isValid = true;

    for (const field of requiredFormFields) {
        errors[field] = "";
        if (form[field] === "" || form[field] === null) {
            errors[field] = "Este campo es requerido";
            isValid = false;
        }
    }

    const variantFields = soldByPiece.value
        ? requiredVariantFields.filter((field) => !pieceExcludedVariantFields.includes(field))
        : requiredVariantFields;

    for (const group of variantGroups.value) {
        // Errores que quedaron de antes de cambiar la Unidad a pieza, en campos ya ocultos.
        if (soldByPiece.value) {
            for (const field of pieceExcludedVariantFields) group.specErrors[field] = "";
        }

        for (const field of variantFields) {
            group.specErrors[field] = "";
            if (group.spec[field] === "" || group.spec[field] === null) {
                group.specErrors[field] = "Este campo es requerido";
                isValid = false;
            }
        }

        for (const row of group.colorRows) {
            for (const field of requiredColorRowFields) {
                row.errors[field] = "";
                if (row[field] === "" || row[field] === null) {
                    row.errors[field] = "Este campo es requerido";
                    isValid = false;
                }
            }
        }
    }

    return isValid;
};

const submitting = ref(false);
const generalError = ref(null);

// Cada variante toma la ficha técnica de su propio grupo. `stock_boxes` solo va al
// crear (stock inicial): en una variante existente el backend lo ignora en el
// update, y el cambio viaja aparte como ajuste (applyStockChanges).
// Vacío viaja como null: la variante queda sin control de stock.
function buildVariantPayload(productId, group, row) {
    const { spec } = group;
    const payload = {
        product_id: productId,
        size: spec.size,
        pei: spec.pei,
        ett: spec.ett,
        kilos_per_box: spec.kilos_per_box,
        boxes_per_pallet: spec.boxes_per_pallet,
        commission_category_id: spec.commission_category_id || null,
        price_per_box: spec.price_per_box,
        price_per_m2: spec.price_per_m2,
        pieces_per_box: spec.pieces_per_box,
        m2_per_box: spec.m2_per_box,
        color: row.color,
        minimum_stock: row.minimum_stock,
    };

    if (!row.variantId) payload.stock_boxes = row.stock_boxes;

    // Pisos por pieza: los campos que no aplican ni siquiera viajan como null.
    if (soldByPiece.value) {
        for (const field of pieceExcludedVariantFields) delete payload[field];
    }

    return payload;
}

// Solo mapea a `errors` los campos del producto — es lo único validado antes
// de que exista un `productId`, momento en el que aplican los 422.
// Devuelve si aplicó alguno. Los guards del backend (ej. el bloqueo de cambio
// de unidad) responden 422 solo con `message`, sin `errors`.
function applyServerErrors(serverErrors = {}) {
    let applied = false;
    for (const field of Object.keys(serverErrors)) {
        if (field in errors) {
            errors[field] = serverErrors[field][0];
            applied = true;
        }
    }
    return applied;
}

// Cambios de stock en variantes existentes, con lo que se muestra al confirmar.
function pendingStockChanges() {
    return variantGroups.value.flatMap((group) =>
        group.colorRows
            .filter((row) => row.variantId)
            .map((row) => ({ group, row, payload: stockChangePayload(row.originalStock, row.stock_boxes) }))
            .filter(({ payload }) => payload)
            .map(({ group, row, payload }) => ({
                row,
                payload,
                label: `${group.spec.size} · ${row.color}`,
                description: describeStockChange(row.originalStock, row.stock_boxes, stockUnit.value.short),
            })),
    );
}

// Corre después de guardar las variantes. Cada ajuste es independiente: los que
// salen bien actualizan `originalStock` para que un reintento no los repita.
// Devuelve los que fallaron (ej. "Stock insuficiente" si hubo una venta mientras
// el form estaba abierto).
async function applyStockChanges(changes) {
    const results = await Promise.allSettled(
        changes.map(({ row, payload }) =>
            axios.patch(`/api/product-variants/${row.variantId}/stock`, payload),
        ),
    );

    return results.flatMap((result, index) => {
        const { row, label } = changes[index];
        if (result.status === "fulfilled") {
            row.stock_boxes = result.value.data.data.stock_boxes;
            row.originalStock = row.stock_boxes;
            return [];
        }
        return [`${label} (${result.reason.response?.data?.message ?? "error inesperado"})`];
    });
}

const handleSubmit = async () => {
    if (!validateForm()) return;

    const stockChanges = pendingStockChanges();
    if (stockChanges.length && !(await confirmStockChanges(confirm, stockChanges))) return;

    generalError.value = null;
    submitting.value = true;
    let productId = isEditMode.value ? route.params.id : null;
    let productSaved = false;

    try {
        const productPayload = {
            supplier_id: form.supplier_id,
            category_id: form.category_id,
            unit_type_id: form.unit_type_id,
            name: form.name,
            purchase_unit: form.purchase_unit,
        };

        if (isEditMode.value) {
            await axios.put(`/api/products/${productId}`, productPayload);
        } else {
            const { data } = await axios.post("/api/products", productPayload);
            productId = data.data.id;
        }
        productSaved = true;

        // Filas sin `variantId` son nuevas en esta sesión de edición (o el flujo de
        // creación, donde ninguna fila lo tiene). No se borra ninguna variante aquí
        // aunque el usuario haya quitado una fila del form — eso es el paso 5.5.
        await Promise.all(
            variantGroups.value.flatMap((group) =>
                group.colorRows.map((row) =>
                    row.variantId
                        ? axios.put(
                            `/api/product-variants/${row.variantId}`,
                            buildVariantPayload(productId, group, row),
                        )
                        : axios.post(
                            "/api/product-variants",
                            buildVariantPayload(productId, group, row),
                        ),
                ),
            ),
        );

        const stockFailures = await applyStockChanges(stockChanges);

        await inventory.fetchProducts();

        if (stockFailures.length) {
            generalError.value = `Se guardaron los cambios, pero no se pudo ajustar el stock de: ${stockFailures.join("; ")}.`;
            return;
        }

        router.push({ name: "inventory", query: inventory.listQuery });
    } catch (err) {
        if (productSaved) {
            console.error(err);
            generalError.value = isEditMode.value
                ? "El producto se actualizó correctamente, pero ocurrió un error al guardar una o más variantes. Revísalo desde el inventario."
                : "El producto se creó correctamente, pero ocurrió un error al guardar una o más variantes. Revísalo desde el inventario.";
        } else if (err.response?.status === 422) {
            // Mismo criterio que CategoryFormDialog/SupplierFormDialog: sin error
            // de campo aplicable, el mensaje va como error general.
            if (!applyServerErrors(err.response.data.errors ?? {})) {
                generalError.value = err.response.data.message || "No se pudo guardar el producto.";
            }
        } else {
            generalError.value =
                err.response?.data?.message || "No se pudo guardar el producto. Intenta de nuevo.";
        }
    } finally {
        submitting.value = false;
    }
};

function handleCancel() {
    router.push({ name: "inventory", query: inventory.listQuery });
}
</script>

<style scoped></style>
