import http from "http";

export async function getCollectionsHandler(): Promise<PrismCurationObj[]> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/get-all-collections",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const collections: PrismCurationObj[] = JSON.parse(data);
          resolve(collections);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

export async function createCollectionHandler(
  collection: PrismCurationObj
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(collection);

    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/create-collection",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(responseData);
          resolve({ message: response.message, status: res.statusCode || 200 });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

export async function deleteCollectionHandler(
  collection: PrismCurationObj
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const mediaItemId = collection.mediaItemId;

    const options = {
      hostname: "localhost",
      port: 3001,
      path: `/api/admin/v1/delete-collection?mediaItemId=${mediaItemId}`,
      method: "DELETE",
    };

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(responseData);
          resolve({ message: response.message, status: res.statusCode || 200 });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

export async function updateCollectionHandler(
  collection: PrismCurationObj
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(collection);
    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/update-collection",
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(responseData);
          resolve({ message: response.message, status: res.statusCode || 200 });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}
