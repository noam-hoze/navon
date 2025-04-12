const stock = [
    {
        id: "SKU1234",
        name: "כוס קרמיקה לבנה",
        category: "כלי בית",
        price: 39.9,
        stock: 12,
        image: "https://example.com/images/cup-white.jpg",
        variants: [
            {
                color: "לבן",
                size: "סטנדרט",
                stock: 12,
            },
        ],
    },
    {
        id: "SKU5678",
        name: "נעלי ספורט גברים",
        category: "הנעלה",
        price: 199.0,
        stock: 3,
        image: "https://example.com/images/mens-sneakers.jpg",
        variants: [
            {
                color: "שחור",
                size: "42",
                stock: 1,
            },
            {
                color: "שחור",
                size: "43",
                stock: 2,
            },
        ],
    },
    {
        id: "SKU9012",
        name: "חולצת טי שירט נשים",
        category: "הלבשה",
        price: 79.0,
        stock: 6,
        image: "https://example.com/images/womens-tshirt.jpg",
        variants: [
            {
                color: "ורוד",
                size: "S",
                stock: 2,
            },
            {
                color: "ורוד",
                size: "M",
                stock: 3,
            },
            {
                color: "ורוד",
                size: "L",
                stock: 1,
            },
        ],
    },
];

export default stock;
