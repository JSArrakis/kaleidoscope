import http from "http";

export async function getAgeGroupsHandler(): Promise<Tag[]> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/get-all-age-groups",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const ageGroups: Tag[] = JSON.parse(data);
          resolve(ageGroups);
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

export async function createAgeGroupHandler(
  ageGroup: Tag
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(ageGroup);

    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/create-age-group",
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

export async function deleteAgeGroupHandler(
  ageGroup: Tag
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const tagId = ageGroup.tagId;

    const options = {
      hostname: "localhost",
      port: 3001,
      path: `/api/admin/v1/delete-age-group?tagId=${tagId}`,
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

export async function updateAgeGroupHandler(
  ageGroup: Tag
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(ageGroup);
    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/update-age-group",
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
