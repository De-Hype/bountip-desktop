import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AssetsFiles from "@/assets";
import SettingsAssets from "@/assets/images/settings";
import { Star, Clock, Truck, ChevronLeft, ChevronRight } from "lucide-react";

const categories = [
  "All",
  "Doughnuts",
  "Croissant",
  "Bread",
  "Cake",
  "Chocolate",
  "Cookie",
  "Coffee",

  // New ones
  "Pastries",
  "Muffins",
  "Cupcakes",
  "Brownies",
  "Cheesecake",
  "Sandwiches",
  "Bagels",
  "Pies",
  "Tarts",
  "Ice Cream",
  "Milkshakes",
  "Smoothies",
  "Tea",
  "Hot Drinks",
  "Cold Drinks",
  "Breakfast",
  "Snacks",
  "Desserts",
  "Vegan",
  "Gluten-Free",
  "Specials",
];

const categorySliderVariants = {
  enter: (direction: 1 | -1) => ({
    x: direction > 0 ? 80 : -80,
  }),
  center: {
    x: 0,
  },
  exit: (direction: 1 | -1) => ({
    x: direction > 0 ? -80 : 80,
  }),
};

type PreviewProduct = {
  id: number;
  badge: string;
  name: string;
  description: string;
  rating: string;
  reviews: string;
  time: string;
  price: string;
  oldPrice: string;
  image: string;
};

const previewProducts: PreviewProduct[] = [
  {
    id: 1,
    badge: "Popular",
    name: "Cake",
    description:
      "Classic Italian pizza with fresh mozzarella, basil, and tomato sauce",
    rating: "4.5",
    reviews: "(324)",
    time: "25-30 Mins",
    price: "£18.98",
    oldPrice: "£19",
    image: AssetsFiles.AuthBgImage,
  },
  {
    id: 2,
    badge: "Premium",
    name: "Cookies",
    description:
      "Fresh romaine lettuce with grilled chicken, parmesan cheese, and caesar dressing",
    rating: "4.6",
    reviews: "(234)",
    time: "10-15 Mins",
    price: "£14.98",
    oldPrice: "£19",
    image: AssetsFiles.AuthBgImage,
  },
  {
    id: 3,
    badge: "Premium",
    name: "English Breakfast",
    description:
      "Juicy beef patty with lettuce, tomato, cheese, and our special sauce",
    rating: "4.9",
    reviews: "(234)",
    time: "10-15 Mins",
    price: "£12.98",
    oldPrice: "£19",
    image: AssetsFiles.AuthBgImage,
  },
  {
    id: 1,
    badge: "Popular",
    name: "Cake",
    description:
      "Classic Italian pizza with fresh mozzarella, basil, and tomato sauce",
    rating: "4.5",
    reviews: "(324)",
    time: "25-30 Mins",
    price: "£18.98",
    oldPrice: "£19",
    image: AssetsFiles.AuthBgImage,
  },
  {
    id: 2,
    badge: "Premium",
    name: "Cookies",
    description:
      "Fresh romaine lettuce with grilled chicken, parmesan cheese, and caesar dressing",
    rating: "4.6",
    reviews: "(234)",
    time: "10-15 Mins",
    price: "£14.98",
    oldPrice: "£19",
    image: AssetsFiles.AuthBgImage,
  },
  {
    id: 3,
    badge: "Premium",
    name: "English Breakfast",
    description:
      "Juicy beef patty with lettuce, tomato, cheese, and our special sauce",
    rating: "4.9",
    reviews: "(234)",
    time: "10-15 Mins",
    price: "£12.98",
    oldPrice: "£19",
    image: AssetsFiles.AuthBgImage,
  },
];

const PreviewStoreFront = () => {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);
  const [categoryStartIndex, setCategoryStartIndex] = useState(0);
  const [categoryDirection, setCategoryDirection] = useState<1 | -1>(1);

  const CATEGORIES_PER_PAGE = 7;
  const CATEGORY_STEP = CATEGORIES_PER_PAGE - 1;
  const maxCategoryStartIndex = Math.max(
    0,
    categories.length - CATEGORIES_PER_PAGE,
  );
  const canSlideLeft = categoryStartIndex > 0;
  const canSlideRight = categoryStartIndex < maxCategoryStartIndex;
  const visibleCategories = categories.slice(
    categoryStartIndex,
    categoryStartIndex + CATEGORIES_PER_PAGE,
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[34px] font-bold text-[#000000]">
            Preview Storefront
          </h2>
          <p className="mt-1 text-sm text-[#737373]">
            Please confirm that all the details you added earlier are correct
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[9.8px] bg-[#15BA5C] px-5 py-2.5 text-sm font-medium text-white cursor-pointer hover:bg-[#13A652]"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M14.2498 5.4997C14.2499 4.74039 14.5158 4.00507 15.0015 3.42137C15.4871 2.83767 16.1618 2.44243 16.9084 2.30427C17.6551 2.1661 18.4265 2.29372 19.0889 2.66497C19.7512 3.03623 20.2627 3.62769 20.5345 4.33669C20.8063 5.0457 20.8212 5.82748 20.5768 6.54637C20.3323 7.26525 19.8438 7.87584 19.1962 8.27217C18.5485 8.66849 17.7825 8.82553 17.0311 8.71603C16.2797 8.60653 15.5904 8.2374 15.0828 7.6727L12.3658 9.1547L9.32581 10.8917C9.75125 11.6396 9.86273 12.5257 9.63581 13.3557L15.0828 16.3267C15.6157 15.7346 16.3475 15.3589 17.1392 15.2708C17.9309 15.1828 18.7274 15.3886 19.3774 15.8491C20.0274 16.3096 20.4856 16.9929 20.665 17.769C20.8444 18.5451 20.7325 19.3601 20.3505 20.0592C19.9686 20.7582 19.3432 21.2927 18.5932 21.561C17.8432 21.8293 17.0207 21.8128 16.282 21.5147C15.5433 21.2165 14.9399 20.6574 14.5862 19.9436C14.2326 19.2298 14.1535 18.411 14.3638 17.6427L8.91681 14.6727C8.50169 15.1344 7.96299 15.4676 7.36445 15.6327C6.76592 15.7979 6.1326 15.7881 5.53944 15.6046C4.94628 15.4211 4.4181 15.0715 4.0174 14.5972C3.61669 14.1229 3.36024 13.5438 3.27837 12.9283C3.19651 12.3128 3.29267 11.6868 3.55546 11.1242C3.81826 10.5617 4.2367 10.0862 4.76127 9.75401C5.28585 9.42183 5.89459 9.24687 6.51549 9.24983C7.13638 9.25279 7.74343 9.43354 8.26481 9.7707L11.6348 7.8447L14.3638 6.3557C14.2885 6.07659 14.2502 5.7888 14.2498 5.4997ZM17.4998 3.7497C17.0357 3.7497 16.5906 3.93408 16.2624 4.26227C15.9342 4.59045 15.7498 5.03557 15.7498 5.4997C15.7498 5.96383 15.9342 6.40895 16.2624 6.73714C16.5906 7.06533 17.0357 7.2497 17.4998 7.2497C17.9639 7.2497 18.4091 7.06533 18.7372 6.73714C19.0654 6.40895 19.2498 5.96383 19.2498 5.4997C19.2498 5.03557 19.0654 4.59045 18.7372 4.26227C18.4091 3.93408 17.9639 3.7497 17.4998 3.7497ZM6.49981 10.7497C6.03568 10.7497 5.59056 10.9341 5.26238 11.2623C4.93419 11.5905 4.74981 12.0356 4.74981 12.4997C4.74981 12.9638 4.93419 13.409 5.26238 13.7371C5.59056 14.0653 6.03568 14.2497 6.49981 14.2497C6.96394 14.2497 7.40906 14.0653 7.73725 13.7371C8.06544 13.409 8.24981 12.9638 8.24981 12.4997C8.24981 12.0356 8.06544 11.5905 7.73725 11.2623C7.40906 10.9341 6.96394 10.7497 6.49981 10.7497ZM15.7498 18.4997C15.7498 18.0356 15.9342 17.5905 16.2624 17.2623C16.5906 16.9341 17.0357 16.7497 17.4998 16.7497C17.9639 16.7497 18.4091 16.9341 18.7372 17.2623C19.0654 17.5905 19.2498 18.0356 19.2498 18.4997C19.2498 18.9638 19.0654 19.409 18.7372 19.7371C18.4091 20.0653 17.9639 20.2497 17.4998 20.2497C17.0357 20.2497 16.5906 20.0653 16.2624 19.7371C15.9342 19.409 15.7498 18.9638 15.7498 18.4997Z"
              fill="white"
            />
          </svg>

          <span>Share Storefront</span>
        </button>
      </div>

      <div className="rounded-[24px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="relative">
          <div className="relative h-56 w-full">
            <img
              src={AssetsFiles.AuthBgImage}
              alt="Storefront cover"
              className="max-h-full w-full object-cover"
            />
          </div>

          <div className="absolute -bottom-10 left-8 h-20 w-20 rounded-full border-4 border-white overflow-hidden bg-white">
            <img
              src={SettingsAssets.CustomizeTab}
              alt="Bakery avatar"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="px-8 pb-6 pt-12">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-[23px] font-bold text-[#000000]">
                Bob&apos;s Bakery
              </h3>
              <div className="mt-1 flex items-center gap-1 text-sm text-[#4B5563]">
                <Star className="h-4 w-4 text-[#FACC15]" fill="#FACC15" />
                <span>3.6</span>
                <span className="text-[#9CA3AF]">(56 reviews)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-10">
              <div className="flex items-center gap-3">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 26 26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.8045 23.4763C18.6983 23.4763 23.4763 18.6983 23.4763 12.8045C23.4763 6.9107 18.6983 2.13281 12.8045 2.13281C6.9107 2.13281 2.13281 6.9107 2.13281 12.8045C2.13281 18.6983 6.9107 23.4763 12.8045 23.4763Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M12.8117 11.2137C11.9277 11.2137 11.2109 11.9304 11.2109 12.8144C11.2109 13.6985 11.9277 14.4152 12.8117 14.4152C13.6957 14.4152 14.4125 13.6985 14.4125 12.8144C14.4125 11.9304 13.6957 11.2137 12.8117 11.2137ZM12.8117 11.2137V7.46875M16.0206 16.0283L13.9411 13.9488"
                    stroke="white"
                    stroke-width="1.20057"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-[#111827]">
                    Opening/Closing Hours
                  </p>
                  <p className="text-xs text-[#6B7280]">8:00 AM - 6:00 PM</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 26 26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.4744 18.6764H10.1386H15.4744ZM16.008 18.6764H21.6248C21.8594 18.6764 21.9768 18.6764 22.0754 18.6641C22.8026 18.5735 23.3753 18.0007 23.4659 17.2736C23.4782 17.175 23.4782 17.0576 23.4782 16.8229V13.8741C23.4782 10.0431 20.3726 6.93746 16.5416 6.93746M15.6099 18.0104L16.008 7.47105C16.008 5.96184 16.008 5.20723 15.5392 4.73838C15.0703 4.26953 14.3157 4.26953 12.8065 4.26953H5.33628C3.82708 4.26953 3.07247 4.26953 2.60362 4.73838C2.13477 5.20723 2.13477 5.96184 2.13477 7.47105V16.0084C2.13477 17.0058 2.13477 17.5045 2.34922 17.876C2.48972 18.1193 2.6918 18.3214 2.93515 18.4619C3.30661 18.6764 3.8053 18.6764 4.8027 18.6764"
                    fill="#15BA5C"
                  />
                  <path
                    d="M15.4744 18.6764H10.1386M16.008 18.6764H21.6248C21.8594 18.6764 21.9768 18.6764 22.0754 18.6641C22.8026 18.5735 23.3753 18.0007 23.4659 17.2736C23.4782 17.175 23.4782 17.0576 23.4782 16.8229V13.8741C23.4782 10.0431 20.3726 6.93746 16.5416 6.93746M15.6099 18.0104L16.008 7.47105C16.008 5.96184 16.008 5.20723 15.5392 4.73838C15.0703 4.26953 14.3157 4.26953 12.8065 4.26953H5.33628C3.82708 4.26953 3.07247 4.26953 2.60362 4.73838C2.13477 5.20723 2.13477 5.96184 2.13477 7.47105V16.0084C2.13477 17.0058 2.13477 17.5045 2.34922 17.876C2.48972 18.1193 2.6918 18.3214 2.93515 18.4619C3.30661 18.6764 3.8053 18.6764 4.8027 18.6764"
                    stroke="white"
                    stroke-width="1.20057"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M20.8124 18.6757C20.8124 20.1492 19.6179 21.3437 18.1445 21.3437C16.671 21.3437 15.4766 20.1492 15.4766 18.6757C15.4766 17.2023 16.671 16.0078 18.1445 16.0078C19.6179 16.0078 20.8124 17.2023 20.8124 18.6757Z"
                    fill="#15BA5C"
                    stroke="white"
                    stroke-width="1.20057"
                  />
                  <path
                    d="M10.1386 18.6757C10.1386 20.1492 8.94412 21.3437 7.47067 21.3437C5.99721 21.3437 4.80273 20.1492 4.80273 18.6757C4.80273 17.2023 5.99721 16.0078 7.47067 16.0078C8.94412 16.0078 10.1386 17.2023 10.1386 18.6757Z"
                    fill="#15BA5C"
                    stroke="white"
                    stroke-width="1.20057"
                  />
                </svg>

                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-[#1E1E1E]">Delivery</p>
                  <p className="text-xs text-[#15BA5C]">Available</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4">
            <div className="flex w-full items-center gap-4">
              {canSlideLeft && (
                <button
                  type="button"
                  onClick={() =>
                    setCategoryStartIndex((prevIndex: number) => {
                      setCategoryDirection(-1);
                      const nextIndex = Math.max(0, prevIndex - CATEGORY_STEP);
                      return nextIndex;
                    })
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#111827] shadow-[0_4px_10px_rgba(0,0,0,0.16)] cursor-pointer"
                  aria-label="Previous categories"
                  title="Previous categories"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              <AnimatePresence initial={false} custom={categoryDirection}>
                <motion.div
                  key={categoryStartIndex}
                  className="flex flex-1 items-center justify-between"
                  variants={categorySliderVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  custom={categoryDirection}
                  transition={{
                    type: "tween",
                    ease: "easeInOut",
                    duration: 0.35,
                  }}
                >
                  {visibleCategories.map((category) => {
                    const isActive = category === activeCategory;

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`text-sm cursor-pointer text-[#000000] ${
                          isActive
                            ? "rounded-[12.8px] bg-[#F6F6F6] px-5 py-3 font-medium"
                            : "px-5 py-3"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>

              {canSlideRight && (
                <button
                  type="button"
                  onClick={() =>
                    setCategoryStartIndex((prevIndex: number) => {
                      setCategoryDirection(1);
                      const nextIndex = Math.min(
                        maxCategoryStartIndex,
                        prevIndex + CATEGORY_STEP,
                      );
                      return nextIndex;
                    })
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#111827] shadow-[0_4px_10px_rgba(0,0,0,0.16)] cursor-pointer"
                  aria-label="Next categories"
                  title="Next categories"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {previewProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_10px_25px_rgba(0,0,0,0.08)]"
                >
                  <div className="relative h-40 w-full">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#111827] shadow-sm">
                      {product.badge}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 px-4 py-3">
                    <p className="text-sm font-semibold text-[#111827]">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {product.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1 text-[#111827]">
                        <Star
                          className="h-4 w-4 text-[#FACC15]"
                          fill="#FACC15"
                        />
                        <span className="font-medium">{product.rating}</span>
                        <span className="text-[#6B7280]">
                          {product.reviews}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[#16A34A]">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6.74813 1.26562C3.72036 1.26562 1.26562 3.72036 1.26562 6.74813C1.26562 9.77589 3.72036 12.2306 6.74813 12.2306C9.77589 12.2306 12.2306 9.77589 12.2306 6.74813C12.2306 3.72036 9.77589 1.26562 6.74813 1.26562ZM9.27851 7.59159H6.74813C6.63628 7.59159 6.52901 7.54716 6.44992 7.46807C6.37083 7.38898 6.3264 7.28171 6.3264 7.16986V3.37428C6.3264 3.26243 6.37083 3.15516 6.44992 3.07607C6.52901 2.99698 6.63628 2.95255 6.74813 2.95255C6.85998 2.95255 6.96724 2.99698 7.04633 3.07607C7.12542 3.15516 7.16986 3.26243 7.16986 3.37428V6.74813H9.27851C9.39036 6.74813 9.49763 6.79256 9.57672 6.87165C9.65581 6.95074 9.70024 7.05801 9.70024 7.16986C9.70024 7.28171 9.65581 7.38898 9.57672 7.46807C9.49763 7.54716 9.39036 7.59159 9.27851 7.59159Z"
                            fill="#15BA5C"
                          />
                        </svg>

                        <span>{product.time}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-[#16A34A]">
                          {product.price}
                        </span>
                        <span className="text-xs text-[#9CA3AF] line-through">
                          {product.oldPrice}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="rounded-full bg-[#15BA5C] px-4 py-1.5 text-xs font-medium text-white cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreviewStoreFront;
