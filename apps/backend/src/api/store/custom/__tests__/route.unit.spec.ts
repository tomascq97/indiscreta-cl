import { GET } from "../route"

describe("GET /store/custom", () => {
  it("responds with HTTP 200 through the route response", async () => {
    const sendStatus = jest.fn()

    await GET({} as never, { sendStatus } as never)

    expect(sendStatus).toHaveBeenCalledTimes(1)
    expect(sendStatus).toHaveBeenCalledWith(200)
  })
})
