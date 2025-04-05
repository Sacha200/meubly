export function getProducts() {
    return fetch('http://localhost:3000/api/v1/furnitures')
        .then(response => response.json())
        .then(json => json.data)
        .catch(error => console.error('Error fetching products:', error));
}

export function getProductById(id) {
    return fetch(`http://localhost:3000/api/v1/furnitures/${id}`)
        .then(response => response.json())
        .then(json => json.data)
        .catch(error => console.error('Error fetching product:', error));
}

/**
 * {
  "error": null,
  "data": [
    
  ],
  "count": null,
  "status": 200,
  "statusText": "OK"
}
 * 
 */