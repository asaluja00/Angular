export type ListItem = {
    icon?: string;
    label: string;
    route?: string;
    children?: ListItem[];
}