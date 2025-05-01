import {
  Html,
  Head,
  Font,
  Preview,
  Heading,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface RestaurantAddedEmailProps {
  username: string;
  restaurant: {
    name: string;
    orderCode: string;
    address: string;
    city: string;
    accentColor: string;
  };
}

export default function RestaurantAddedEmail({
  username,
  restaurant,
}: RestaurantAddedEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Restaurant Submission Confirmation</title>
        <Font
          fontFamily="Poppins"
          fallbackFontFamily="sans-serif"
          webFont={{
            url: "https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJLucHtF.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>

      <Preview>
        Your restaurant "{restaurant.name}" was submitted successfully
      </Preview>

      <Section style={{ fontFamily: "Poppins, sans-serif" }}>
        <Row>
          <Heading as="h2">Hi {username},</Heading>
        </Row>
        <Row>
          <Text>
            Thank you for submitting your restaurant to NUSTBites! 🎉 Your
            restaurant has been added successfully.
          </Text>
        </Row>
        <Row>
          <Text>Here are the details you submitted:</Text>
        </Row>
        <Row>
          <Text>
            <strong>Name:</strong> {restaurant.name} <br />
            <strong>Order Code:</strong> {restaurant.orderCode} <br />
            <strong>Address:</strong> {restaurant.address}, {restaurant.city}{" "}
            <br />
            <strong>Accent Color:</strong> {restaurant.accentColor}
          </Text>
        </Row>
        <Row>
          <Text>
            Our team will now verify your restaurant. This process usually takes
            between <strong>48 to 72 hours</strong>. You will receive another
            email once your restaurant is verified and made live on the
            platform.
            <br />
            <br />
            <strong>In the meantime:</strong> you can go ahead and add your
            restaurant’s menu items from the restaurant’s dashboard.
            Verification requires <strong>at least 3 menu items</strong> to be
            added.
            <br />
            <br />
            If you don’t see the dashboard, please try refreshing your browser
            or signing in again.
          </Text>
        </Row>
        <Row>
          <Text>
            If you have any questions or need support, feel free to reply to
            this email.
          </Text>
        </Row>
        <Row>
          <Text>
            Thanks again,
            <br />
            Team NUSTBites
          </Text>
        </Row>
      </Section>
    </Html>
  );
}
