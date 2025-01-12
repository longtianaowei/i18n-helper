export function camelCase(str: string): string {
    return str
        .replace(/[\u4e00-\u9fa5]+/g, word => word)
        .replace(/[^\w\s]/g, '')
        .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
        .replace(/\s/g, '')
        .replace(/^[A-Z]/, c => c.toLowerCase());
} 