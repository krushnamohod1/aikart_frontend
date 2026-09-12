export default function ExploreLoading() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ex-skel-pulse {
              animation: exSkelShimmer 1.6s infinite ease-in-out;
              background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
              background-size: 200% 100%;
            }
            @keyframes exSkelShimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            .ex-skel-card {
              background: #ffffff;
              border-radius: 24px;
              border: 1px solid #e2e8f0;
              padding: 16px;
              display: flex;
              flex-direction: column;
              box-shadow: 0 2px 12px rgba(15,23,42,0.03);
            }
          `,
        }}
      />
      <div className="flex flex-1 pt-20 bg-[#f4f4f4]">
        <main className="ex-main w-full" style={{ padding: "32px", minWidth: 0 }}>
          {/* Top filter bar skeleton placeholder */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "28px",
              flexWrap: "wrap",
            }}
          >
            <div
              className="ex-skel-pulse"
              style={{
                height: "44px",
                flex: "1 1 300px",
                borderRadius: "999px",
              }}
            />
            <div
              className="ex-skel-pulse"
              style={{
                height: "44px",
                width: "120px",
                borderRadius: "999px",
              }}
            />
            <div
              className="ex-skel-pulse"
              style={{
                height: "44px",
                width: "100px",
                borderRadius: "999px",
              }}
            />
          </div>

          {/* Heading skeleton */}
          <div style={{ marginBottom: "28px" }}>
            <div
              className="ex-skel-pulse"
              style={{
                height: "36px",
                width: "280px",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            />
            <div
              className="ex-skel-pulse"
              style={{
                height: "18px",
                width: "440px",
                borderRadius: "6px",
              }}
            />
          </div>

          {/* Cards Grid skeleton (8 cards) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="ex-skel-card">
                {/* Banner & Logo skeleton */}
                <div style={{ position: "relative", marginBottom: "20px" }}>
                  <div
                    className="ex-skel-pulse"
                    style={{
                      height: "104px",
                      width: "100%",
                      borderRadius: "16px",
                    }}
                  />
                  <div
                    className="ex-skel-pulse"
                    style={{
                      position: "absolute",
                      left: "16px",
                      bottom: "-16px",
                      width: "52px",
                      height: "52px",
                      borderRadius: "14px",
                      border: "2px solid #ffffff",
                    }}
                  />
                </div>

                {/* Body skeleton */}
                <div style={{ padding: "8px 4px 4px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div
                    className="ex-skel-pulse"
                    style={{
                      height: "20px",
                      width: "70%",
                      borderRadius: "6px",
                      marginBottom: "10px",
                    }}
                  />
                  <div
                    className="ex-skel-pulse"
                    style={{
                      height: "14px",
                      width: "90%",
                      borderRadius: "4px",
                      marginBottom: "6px",
                    }}
                  />
                  <div
                    className="ex-skel-pulse"
                    style={{
                      height: "14px",
                      width: "60%",
                      borderRadius: "4px",
                      marginBottom: "20px",
                    }}
                  />

                  {/* Foot skeleton */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "14px",
                      marginTop: "auto",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <div
                      className="ex-skel-pulse"
                      style={{
                        height: "18px",
                        width: "60px",
                        borderRadius: "4px",
                      }}
                    />
                    <div
                      className="ex-skel-pulse"
                      style={{
                        height: "32px",
                        width: "90px",
                        borderRadius: "999px",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
