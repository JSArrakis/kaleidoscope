import http from "http";

export async function getSpecialtyTagsHandler(): Promise<Tag[]> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/get-all-specialty-tags",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const tags: Tag[] = JSON.parse(data);
          resolve(tags);
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

export async function createSpecialtyTagHandler(
  tag: Tag
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(tag);

    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/create-specialty-tag",
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

export async function deleteSpecialtyTagHandler(
  tag: Tag
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3001,
      path: `/api/admin/v1/delete-specialty-tag?tagId=${tag.tagId}`,
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
