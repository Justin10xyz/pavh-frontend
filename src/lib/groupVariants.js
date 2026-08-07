export function groupVariants(variants) {
	const groups = new Map()

	for (const variant of variants) {
		const categoryId = variant.commission_category?.id ?? null
		const key = [variant.size, variant.pei, variant.ett, categoryId, variant.price_per_box].join('|')

		if (!groups.has(key)) {
			groups.set(key, {
				key,
				size: variant.size,
				pei: variant.pei,
				ett: variant.ett,
				commission_category: variant.commission_category,
				price_per_box: variant.price_per_box,
				price_per_m2: variant.price_per_m2,
				pieces_per_box: variant.pieces_per_box,
				m2_per_box: variant.m2_per_box,
				kilos_per_box: variant.kilos_per_box,
				boxes_per_pallet: variant.boxes_per_pallet,
				variants: []
			})
		}

		groups.get(key).variants.push(variant)
	}

	return Array.from(groups.values())
}
