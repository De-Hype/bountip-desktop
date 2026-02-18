import EmptyStateAssests from "@/assets/images/empty-state";

const NotFound = () => {
  return (
    <section className="my-4 flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <img
        className="h-[260px] sm:h-[320px] md:h-[360px] lg:h-[400px] object-contain"
        src={EmptyStateAssests.ProductManagementEmptyState}
        alt="Product Management Empty State"
      />
      <div className="flex items-center flex-col justify-center gap-2 mt-3">
        <h3 className="text-[1.25rem] font-medium">No Product Created</h3>
        <p className="text-[#898989] text-base">
          You have no product in stock at the moment click on the button above
          to create a product
        </p>
      </div>
    </section>
  );
};

export default NotFound;
