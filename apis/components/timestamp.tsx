import { formatInTimeZone } from "date-fns-tz";

type Props = {
  date: Date;
};

export default function Timestamp(props: Props) {
  const formatted = formatInTimeZone(
    props.date,
    "America/Monterrey",
    "dd/MM/yyyy hh:mm:ss a",
  );

  return <time dateTime={props.date.toISOString()}>{formatted}</time>;
}
