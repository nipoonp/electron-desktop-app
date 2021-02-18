import React from "react";
import {
  Space4,
  Space6,
  Space,
  Space2,
  Space3,
} from "../../tabin/components/spaces";
import { useHistory } from "react-router";
import { useUser } from "../../context/user-context";
import { restaurantPath, orderTypePath } from "../main";
import { KioskPageWrapper } from "../../tabin/components/kioskPageWrapper";
import { Title3Font, Title2Font } from "../../tabin/components/fonts";
import { SizedBox } from "../../tabin/components/sizedBox";
import { S3Image } from "aws-amplify-react";
import { CarouselProvider, Slider, Slide } from "pure-react-carousel";
import "pure-react-carousel/dist/react-carousel.es.css";

export const BeginOrder = (props: {}) => {
  const { user } = useUser();

  if (!user) {
    throw "User must log in!";
  }

  if (user.restaurants.items.length == 0) {
    return <div>This user is not an owner of any restaurants</div>;
  }

  return (
    <>
      {user.restaurants.items[0].advertisements.items.length > 0 ? (
        <>
          <BeginOrderAdvertisements />
        </>
      ) : (
          <>
            <BeginOrderDefault />
          </>
        )}
    </>
  );
};

const BeginOrderAdvertisements = () => {
  const history = useHistory();
  const { user } = useUser();

  if (!user) {
    throw "User must log in!";
  }

  return (
    <KioskPageWrapper>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          position: "absolute",
          height: "100%",
          width: "100%",
          backgroundColor: "#F2F2F2",
        }}
        onClick={() => {
          const userRestaurantId = user.restaurants.items[0].id;

          history.push(restaurantPath + "/" + userRestaurantId);
        }}
      >
        <div
          style={{
            fontSize: "84px",
            fontWeight: 600,
            textAlign: "center",
            paddingTop: "40px",
          }}
        >
          <div>ORDER</div>
          <Space2 />
          <div style={{ fontSize: "156px", color: "var(--primary-color)" }}>
            HERE
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "-75px",
            backgroundColor: "rgb(255, 255, 255)",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            zIndex: 1,
            opacity: 0.8,
            textAlign: "center",
            paddingTop: "32px",
            boxShadow:
              "0 50px 100px -20px rgba(50,50,93,.25), 0 30px 60px -30px rgba(0,0,0,.3)",
          }}
        >
          <img
            style={{ height: "76px" }}
            src="https://tabin-public.s3-ap-southeast-2.amazonaws.com/images/touch-here-dark.png"
          />
          <Space3 />
          <div
            style={{
              fontWeight: 600,
              fontSize: "20px",
            }}
          >
            <div>TOUCH TO BEGIN</div>
          </div>
        </div>
      </div>

      <div
        style={{
          pointerEvents: "none",
        }}
      >
        <CarouselProvider
          naturalSlideWidth={500}
          naturalSlideHeight={1000}
          totalSlides={user.restaurants.items[0].advertisements.items.length}
          isPlaying={true}
          isIntrinsicHeight={true}
        >
          <Slider>
            {user.restaurants.items[0].advertisements.items.map(
              (advertisement, index) => (
                <Slide index={index}>
                  <S3Image
                    level="protected"
                    imgKey={advertisement.content.key}
                    identityId={advertisement.content.identityPoolId}
                    theme={{
                      photoImg: {
                        // boxSizing: "border-box",
                        width: "100%",
                        height: "100vh",
                        objectFit: "contain",
                        padding: "332px 42px 148px 42px",
                      },
                    }}
                  />
                </Slide>
              )
            )}
          </Slider>
        </CarouselProvider>
      </div>
    </KioskPageWrapper>
  );
};

const BeginOrderDefault = () => {
  const history = useHistory();
  const { user } = useUser();

  if (!user) {
    throw "User must log in!";
  }

  return (
    <>
      <KioskPageWrapper>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            backgroundColor: "var(--primary-color)",
            padding: "32px",
            overflow: "auto",
          }}
        >
          <div
            style={{
              color: "#ffffff",
              display: "flex",
              flex: "1",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
            onClick={() => {
              const userRestaurantId = user.restaurants.items[0].id;

              history.push(restaurantPath + "/" + userRestaurantId);
            }}
          >
            <div style={{ fontSize: "128px" }}>ORDER</div>
            <Space6 />
            <div style={{ fontSize: "220px", fontWeight: "bold" }}>HERE</div>
            <Space6 />
            <div style={{ fontSize: "128px" }}>AND PAY</div>
            <Space size={300} />
            <img
              style={{ height: "128px" }}
              src="https://tabin-public.s3-ap-southeast-2.amazonaws.com/images/touch-here.png"
            />
            <Space4 />
            <Title3Font style={{ fontWeight: 400 }}>
              Touch to get started
            </Title3Font>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <Title2Font
              style={{
                fontWeight: 400,
              }}
            >
              Powered by
            </Title2Font>
            <SizedBox width="6px" />
            <Title2Font
              style={{
                fontSize: "30px",
                fontWeight: 600,
                fontStyle: "italic",
              }}
            >
              TABIN
            </Title2Font>
          </div>
        </div>
      </KioskPageWrapper>
    </>
  );
};
