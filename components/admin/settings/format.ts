const RM = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' });

export const formatRM = (value: number) => RM.format(value || 0);
