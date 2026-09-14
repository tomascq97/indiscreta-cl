import {
  deduplicateBranchOffices,
  parsePositiveIntegerQuery,
} from "../route";

describe("Shipit branch offices route helpers", () => {
  describe("parsePositiveIntegerQuery", () => {
    it("parses a positive integer", () => {
      expect(parsePositiveIntegerQuery("146", "commune_id")).toBe(146);
    });

    it("accepts the first query value when Express provides an array", () => {
      expect(parsePositiveIntegerQuery(["1"], "courier_id")).toBe(1);
    });

    it.each([
      undefined,
      "",
      "0",
      "-1",
      "1.5",
      "abc",
    ])("rejects invalid value %p", (value) => {
      expect(() =>
        parsePositiveIntegerQuery(value, "courier_id"),
      ).toThrow("courier_id must be a positive integer");
    });
  });

  describe("deduplicateBranchOffices", () => {
    it("deduplicates the same physical branch by courier, commune and address", () => {
      const result = deduplicateBranchOffices([
        {
          id: 939,
          courier_id: 1,
          courier_bo_id: "first",
          name: "Concepcion Colo Colo",
          address: "Colo Colo 430",
          commune_id: 146,
        },
        {
          id: 7571,
          courier_id: 1,
          courier_bo_id: "duplicate",
          name: "CONCEPCION COLO COLO",
          address: "COLO COLO 430",
          commune_id: 146,
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(939);
    });

    it("normalizes accents and repeated whitespace in addresses", () => {
      const result = deduplicateBranchOffices([
        {
          id: 1,
          courier_id: 2,
          courier_bo_id: "a",
          name: "Sucursal A",
          address: "Camilo Henríquez 2565",
          commune_id: 146,
        },
        {
          id: 2,
          courier_id: 2,
          courier_bo_id: "b",
          name: "Sucursal B",
          address: "  CAMILO   HENRIQUEZ 2565 ",
          commune_id: 146,
        },
      ]);

      expect(result).toHaveLength(1);
    });

    it("does not merge branches from different couriers", () => {
      const result = deduplicateBranchOffices([
        {
          id: 1,
          courier_id: 1,
          courier_bo_id: "a",
          name: "Sucursal Chilexpress",
          address: "Tucapel 530",
          commune_id: 146,
        },
        {
          id: 2,
          courier_id: 2,
          courier_bo_id: "b",
          name: "Sucursal Starken",
          address: "Tucapel 530",
          commune_id: 146,
        },
      ]);

      expect(result).toHaveLength(2);
    });

    it("deduplicates Shipit aliases by normalized courier branch identifier", () => {
      const result = deduplicateBranchOffices([
        {
          id: 7572,
          courier_id: 1,
          courier_bo_id: "chilexpress - CONCEPCION MAIPU DOS",
          name: "CONCEPCION MAIPU DOS",
          address: "MAIPU 583",
          commune_id: 146,
        },
        {
          id: 940,
          courier_id: 1,
          courier_bo_id: "chilexpress - Concepcion Maipu Dos",
          name: "Concepcion Maipu Dos",
          address: "maipu - 583 - local 1",
          commune_id: 146,
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(940);
    });

    it("chooses the lowest id deterministically regardless of input order", () => {
      const first = deduplicateBranchOffices([
        {
          id: 7570,
          courier_id: 1,
          courier_bo_id: "chilexpress - PICK UP DONDE EL TATA NANO",
          name: "PICK UP DONDE EL TATA NANO",
          address: "AVENIDA SAN SEBASTIAN 916",
          commune_id: 146,
        },
        {
          id: 1229,
          courier_id: 1,
          courier_bo_id: "chilexpress - pick up donde el tata nano",
          name: "pick up donde el tata nano",
          address: "avenida san sebastian - 916 - local 6",
          commune_id: 146,
        },
      ]);

      const second = deduplicateBranchOffices([
        {
          id: 1229,
          courier_id: 1,
          courier_bo_id: "chilexpress - pick up donde el tata nano",
          name: "pick up donde el tata nano",
          address: "avenida san sebastian - 916 - local 6",
          commune_id: 146,
        },
        {
          id: 7570,
          courier_id: 1,
          courier_bo_id: "chilexpress - PICK UP DONDE EL TATA NANO",
          name: "PICK UP DONDE EL TATA NANO",
          address: "AVENIDA SAN SEBASTIAN 916",
          commune_id: 146,
        },
      ]);

      expect(first).toHaveLength(1);
      expect(second).toHaveLength(1);
      expect(first[0]?.id).toBe(1229);
      expect(second[0]?.id).toBe(1229);
    });
    it("does not merge the same address in different communes", () => {
      const result = deduplicateBranchOffices([
        {
          id: 1,
          courier_id: 1,
          courier_bo_id: "a",
          name: "Sucursal A",
          address: "Freire 100",
          commune_id: 146,
        },
        {
          id: 2,
          courier_id: 1,
          courier_bo_id: "b",
          name: "Sucursal B",
          address: "Freire 100",
          commune_id: 999,
        },
      ]);

      expect(result).toHaveLength(2);
    });
  });
});

