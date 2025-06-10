run: Invoke-RestMethod -Uri "https://openrouter.ai/api/v1/auth/key" -Headers @{"Authorization" = "Bearer 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"} | ConvertTo-Json -Depth 10

{
    "data":  {
                 "label":  "sk-or-v1-550...cd6",
                 "limit":  null,
                 "usage":  0.9023799775,
                 "limit_remaining":  null,
                 "is_free_tier":  false,
                 "rate_limit":  {
                                    "requests":  40,
                                    "interval":  "10s"
                                }
             }
}
PS C:\Users\New User\Desktop\Imporant coding projects\Pixelkeywording\meta-generation-tool-official>