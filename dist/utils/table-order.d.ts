type Table = {
    name: string;
    relations?: {
        reference: {
            table: string;
        };
    }[];
};
declare function getCreateOrder(schema: Table[]): string[];
