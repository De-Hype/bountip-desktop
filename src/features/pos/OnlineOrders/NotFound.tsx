import EmptyStateAssests from "@/assets/images/empty-state";

const NotFound = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      {/* Space for Icon - You can add your icon here */}
      <div className="w-[180px] h-[140px] mb-8 flex items-center justify-center">
        <img
          src={EmptyStateAssests.OnlineOrdersEmptyState}
          alt="Online Orders Empty State"
        />
      </div>

      <h2 className="text-[25px] font-bold text-[#1E1E1E] mb-2">
        No Orders Yet
      </h2>

      <p className="text-[16px] text-[#737373] text-center max-w-[480px] leading-relaxed">
        You do not have an incoming online order from your channels, head over
        to settings and share your storefront for more visibility
      </p>
    </div>
  );
}

export default NotFound