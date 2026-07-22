
import { BQItem, CalculationPart, PresetGroup } from "../types";

export const createItem = (
    library: PresetGroup[],
    groupId: string, 
    itemId: string, 
    varId: string | null = null, 
    customParts?: CalculationPart[] 
): BQItem => {
    const group = library.find(g => g.id === groupId);
    if(!group) throw new Error("Group not found: " + groupId);
    const item = group.items.find(i => i.id === itemId);
    if(!item) throw new Error("Item not found: " + itemId);
    
    let variant = null;
    let rate = item.rate || 0;
    let unit = item.unit || '';
    let desc = item.description;

    if (varId) {
        variant = item.variants?.find(v => v.id === varId);
        if(variant) {
            rate = variant.rate;
            unit = variant.unit;
        }
    }

    let calculationParts: CalculationPart[] = [];
    let calculatedQty = 0;

    const u = unit.toLowerCase().trim();
    let hasLength = false;
    let hasWidth = false;
    let hasDepth = false;
    let isGlobal = false;
    let defaultQty = 1;

    const isM = u === 'm' || u === 'meter';
    const isM2 = u === 'm2' || u === 'm²' || u === 'sqm';
    const isM3 = u === 'm3' || u === 'm³' || u === 'cum';
    
    if (isM) {
        hasLength = true;
        isGlobal = true;
        defaultQty = 0;
    } else if (isM2) {
        hasLength = true;
        hasWidth = true;
        isGlobal = true;
        defaultQty = 0;
    } else if (isM3) {
        hasLength = true;
        hasWidth = true;
        hasDepth = true;
        isGlobal = true;
        defaultQty = 0;
    } else {
        isGlobal = false;
        defaultQty = 1;
    }

    const isOneByOne = variant && variant.label.includes("1.0m x 1.0m");
    if (isOneByOne) {
        isGlobal = false;
        hasLength = true;
        hasWidth = true;
        hasDepth = false;
    }

    if (customParts && customParts.length > 0) {
        calculationParts = customParts.map(p => ({
            ...p,
            id: Math.random().toString(36).substr(2, 9)
        }));
        
        calculatedQty = calculationParts.reduce((acc, part) => {
            let product = 1;
            if (part.hasLength) product *= part.length;
            if (part.hasWidth) product *= part.width;
            if (part.hasDepth) product *= part.depth;
            return acc + (product * part.multiplier);
        }, 0);
    } else {
        calculationParts = [{
            id: Math.random().toString(36).substr(2, 9),
            label: "",
            length: isOneByOne ? 1 : 0,
            width: isOneByOne ? 1 : 0,
            depth: 0,
            multiplier: 1, 
            hasLength,
            hasWidth,
            hasDepth
        }];
        calculatedQty = isOneByOne ? 1 : defaultQty;
    }

    const finalDesc = varId && variant ? variant.label : desc;

    return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'ITEM',
        description: finalDesc,
        variant: undefined, 
        unit,
        rate,
        qty: parseFloat(calculatedQty.toFixed(2)),
        amount: parseFloat((calculatedQty * rate).toFixed(2)),
        isGlobal: isGlobal, 
        calculationParts,
        isCustomCalc: false,
    };
};

export const createHeader = (title: string): BQItem => ({
    id: Math.random().toString(36).substr(2, 9),
    type: 'HEADER',
    description: title,
    unit: '',
    rate: 0,
    qty: 0,
    amount: 0,
    calculationParts: []
});
