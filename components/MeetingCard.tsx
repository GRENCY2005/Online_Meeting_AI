"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { avatarImages } from "@/constants";
import { useToast } from "./ui/use-toast";

interface MeetingCardProps {
  title: string;
  date: string;
  icon: string;
  isPreviousMeeting?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
}

const MeetingCard = ({
  title,
  date,
  icon,
  isPreviousMeeting,
  buttonIcon1,
  buttonText,
  handleClick,
  link,
}: MeetingCardProps) => {
  const { toast } = useToast();

  return (
    <section className="group relative flex min-h-[220px] w-full flex-col justify-between
      rounded-3xl bg-white
      border border-indigo-100/60
      shadow-card hover:shadow-card-hover
      transition-all duration-350 hover:-translate-y-1.5
      px-6 py-5 xl:max-w-[568px] overflow-hidden">

      {/* Top indigo accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-400 rounded-t-3xl" />

      {/* Subtle bg tint on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-violet-50/0 group-hover:from-indigo-50/40 group-hover:to-violet-50/30 transition-all duration-500 pointer-events-none rounded-3xl" />

      {/* Header */}
      <article className="relative flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100/60">
            <Image src={icon} alt="meeting type" width={20} height={20} />
          </div>
          {isPreviousMeeting && (
            <span className="text-[10px] font-semibold bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full uppercase tracking-wide">
              Ended
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-[15px] font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-700 transition-colors duration-200">
            {title}
          </h1>
          <p className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
            <svg className="w-3 h-3 text-indigo-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {date}
          </p>
        </div>
      </article>

      {/* Avatars */}
      <article className="relative flex items-center py-1">
        <div className="flex items-center">
          {avatarImages.map((img, index) => (
            <Image
              key={index}
              src={img}
              alt="attendees"
              width={28}
              height={28}
              className="rounded-full border-2 border-white -ml-2 first:ml-0 shrink-0 shadow-sm"
            />
          ))}
          <div className="flex items-center justify-center h-7 w-7 rounded-full border-2 border-white
            bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-500 text-[10px] font-bold -ml-2 shadow-sm">
            +5
          </div>
        </div>
      </article>

      {/* Buttons */}
      <article className="relative">
        <div className="flex gap-2">
          {!isPreviousMeeting && (
            <Button
              onClick={handleClick}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700
                text-white rounded-xl h-9 px-4 text-xs font-semibold
                transition-all duration-200 shadow-sm hover:shadow-glow-indigo gap-1.5"
            >
              {buttonIcon1 && <Image src={buttonIcon1} alt="feature" width={13} height={13} />}
              {buttonText || 'Start'}
            </Button>
          )}

          <Button
            onClick={() => {
              navigator.clipboard.writeText(link);
              toast({ title: "Link Copied" });
            }}
            variant="outline"
            className="border-indigo-100 text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600
              rounded-xl h-9 px-3 text-xs font-medium transition-all duration-200 gap-1.5"
          >
            <Image src="/icons/copy.svg" alt="copy" width={13} height={13} />
            Copy Link
          </Button>
        </div>
      </article>
    </section>
  );
};

export default MeetingCard;
