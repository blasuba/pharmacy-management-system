package com.pharmacy.pms.config;

import com.pharmacy.pms.model.entity.*;
import com.pharmacy.pms.model.enums.CustomerType;
import com.pharmacy.pms.model.enums.DosageForm;
import com.pharmacy.pms.model.enums.UserRole;
import com.pharmacy.pms.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final String MODULE_INVENTORY = "INVENTORY";
    private static final String MODULE_POS = "POS";
    private static final String MODULE_PROCUREMENT = "PROCUREMENT";
    private static final String MODULE_REPORTS = "REPORTS";
    private static final String MODULE_ADMIN = "ADMIN";
    private static final String UOM_BOX = "BOX";
    private static final String UOM_STRIP = "STRIP";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final BranchRepository branchRepository;
    private final CategoryRepository categoryRepository;
    private final DrugRepository drugRepository;
    private final DrugBatchRepository batchRepository;
    private final SupplierRepository supplierRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-password:Admin@123}")
    private String initialAdminPassword;

    @Value("${app.seed.pharmacist-password:Pharm@123}")
    private String initialPharmacistPassword;

    @Value("${app.seed.cashier-password:Cash@123}")
    private String initialCashierPassword;

    public DataInitializer(UserRepository userRepository, RoleRepository roleRepository,
                           PermissionRepository permissionRepository, BranchRepository branchRepository,
                           CategoryRepository categoryRepository, DrugRepository drugRepository,
                           DrugBatchRepository batchRepository, SupplierRepository supplierRepository,
                           CustomerRepository customerRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.branchRepository = branchRepository;
        this.categoryRepository = categoryRepository;
        this.drugRepository = drugRepository;
        this.batchRepository = batchRepository;
        this.supplierRepository = supplierRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // Already initialized
        }

        // 1. Create Permissions
        Permission p1 = permissionRepository.save(new Permission("DRUG_READ", "View drug catalog", MODULE_INVENTORY));
        Permission p2 = permissionRepository.save(new Permission("DRUG_CREATE", "Create drug catalog", MODULE_INVENTORY));
        Permission p3 = permissionRepository.save(new Permission("DRUG_EDIT", "Update drug catalog", MODULE_INVENTORY));
        Permission p4 = permissionRepository.save(new Permission("BATCH_MANAGE", "Manage drug batches & stock", MODULE_INVENTORY));
        Permission p5 = permissionRepository.save(new Permission("INVENTORY_ADJUST", "Adjust stock damage/write-off", MODULE_INVENTORY));
        Permission p6 = permissionRepository.save(new Permission("POS_CHECKOUT", "Process POS checkout", MODULE_POS));
        Permission p7 = permissionRepository.save(new Permission("PURCHASE_RECEIVE", "Receive PO and GRN", MODULE_PROCUREMENT));
        Permission p8 = permissionRepository.save(new Permission("REPORT_PROFIT_VIEW", "View profit & loss reports", MODULE_REPORTS));
        Permission p9 = permissionRepository.save(new Permission("USER_MANAGE", "Manage staff accounts & roles", MODULE_ADMIN));
        Permission p10 = permissionRepository.save(new Permission("SUPPLIER_MANAGE", "Manage suppliers", MODULE_PROCUREMENT));

        // 2. Create Roles
        Role ownerRole = new Role(UserRole.ROLE_OWNER, "Owner / Super Admin", "Full system access");
        ownerRole.setPermissions(new HashSet<>(Set.of(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10)));
        roleRepository.save(ownerRole);

        Role pharmacistRole = new Role(UserRole.ROLE_PHARMACIST, "Pharmacist", "Dispense, manage batches and stock");
        pharmacistRole.setPermissions(new HashSet<>(Set.of(p1, p3, p4, p5, p6, p7)));
        roleRepository.save(pharmacistRole);

        Role cashierRole = new Role(UserRole.ROLE_CASHIER_ACCOUNTANT, "Cashier / Sales & Accounting", "POS sales, receipts and cash reports");
        cashierRole.setPermissions(new HashSet<>(Set.of(p1, p6)));
        roleRepository.save(cashierRole);

        // 3. Create Main Branch
        Branch mainBranch = new Branch("Apex Central Pharmacy & Distribution", "BR-HQ-01", "Bole Medhanialem Suite 402, Addis Ababa", "+251-911-000000", "PH-ET-2026-88910", true);
        branchRepository.save(mainBranch);

        // 4. Create Users
        User admin = new User();
        admin.setUsername("admin");
        admin.setEmail("admin@apexpharmacy.com");
        admin.setPassword(passwordEncoder.encode(initialAdminPassword));
        admin.setFirstName("Abebe");
        admin.setLastName("Kebede");
        admin.setBranch(mainBranch);
        admin.setRoles(new HashSet<>(Set.of(ownerRole)));
        userRepository.save(admin);

        User pharmacist = new User();
        pharmacist.setUsername("pharmacist");
        pharmacist.setEmail("pharmacist@apexpharmacy.com");
        pharmacist.setPassword(passwordEncoder.encode(initialPharmacistPassword));
        pharmacist.setFirstName("Bethlehem");
        pharmacist.setLastName("Tadesse");
        pharmacist.setBranch(mainBranch);
        pharmacist.setRoles(new HashSet<>(Set.of(pharmacistRole)));
        userRepository.save(pharmacist);

        User cashier = new User();
        cashier.setUsername("cashier");
        cashier.setEmail("cashier@apexpharmacy.com");
        cashier.setPassword(passwordEncoder.encode(initialCashierPassword));
        cashier.setFirstName("Dawit");
        cashier.setLastName("Yohannes");
        cashier.setBranch(mainBranch);
        cashier.setRoles(new HashSet<>(Set.of(cashierRole)));
        userRepository.save(cashier);

        // 5. Create Categories
        Category catAntibiotics = categoryRepository.save(new Category("Antibiotics", "Antimicrobial medications"));
        Category catAnalgesics = categoryRepository.save(new Category("Analgesics & Antipyretics", "Pain and fever relief"));
        categoryRepository.save(new Category("Antihypertensives", "Cardiovascular medications"));
        categoryRepository.save(new Category("Cough & Cold Syrups", "Liquid cold formulations"));
        categoryRepository.save(new Category("Vitamins & Supplements", "Immune boosters and nutritional supplements"));

        // 6. Create Suppliers
        Supplier s1 = new Supplier();
        s1.setName("EPHARM Pharmaceutical Mfg");
        s1.setContactPerson("Almaz Bekele");
        s1.setPhone("+251-115-512345");
        s1.setEmail("sales@epharm.com.et");
        s1.setTaxNumber("TIN-001928374");
        s1.setPaymentTermsDays(30);
        supplierRepository.save(s1);

        Supplier s2 = new Supplier();
        s2.setName("Cadila Healthcare & Distribution");
        s2.setContactPerson("Rahul Sharma");
        s2.setPhone("+251-912-998877");
        s2.setEmail("orders@cadila-ethiopia.com");
        s2.setPaymentTermsDays(45);
        supplierRepository.save(s2);

        // 7. Create Customers
        Customer c1 = new Customer();
        c1.setName("Red Cross Clinic (Wholesale)");
        c1.setPhone("+251-911-223344");
        c1.setEmail("procurement@redcrossclinic.et");
        c1.setCustomerType(CustomerType.WHOLESALE);
        c1.setCreditLimit(BigDecimal.valueOf(50000));
        customerRepository.save(c1);

        // 8. Create Sample Drugs & Batches with FEFO data
        // Drug 1: Amoxicillin
        Drug d1 = new Drug();
        d1.setName("Amoxil 500mg");
        d1.setGenericName("Amoxicillin Trihydrate");
        d1.setCategory(catAntibiotics);
        d1.setDosageForm(DosageForm.CAPSULE);
        d1.setStrength("500mg");
        d1.setUnitOfMeasure(UOM_BOX);
        d1.setBarcode("6001234567890");
        d1.setReorderThreshold(25);
        d1.setPrescriptionRequired(true);
        drugRepository.save(d1);

        // Batch 1 (Near expiry -> FEFO priority #1)
        DrugBatch b1 = new DrugBatch();
        b1.setDrug(d1);
        b1.setSupplier(s1);
        b1.setBranch(mainBranch);
        b1.setBatchNumber("AMX-2026-01");
        b1.setExpiryDate(LocalDate.now().plusMonths(3));
        b1.setQuantityOnHand(50);
        b1.setBuyingPrice(BigDecimal.valueOf(180.00));
        b1.setRetailPrice(BigDecimal.valueOf(250.00));
        b1.setWholesalePrice(BigDecimal.valueOf(210.00));
        b1.setDistributorPrice(BigDecimal.valueOf(195.00));
        batchRepository.save(b1);

        // Batch 2 (Far expiry -> FEFO priority #2)
        DrugBatch b2 = new DrugBatch();
        b2.setDrug(d1);
        b2.setSupplier(s1);
        b2.setBranch(mainBranch);
        b2.setBatchNumber("AMX-2027-02");
        b2.setExpiryDate(LocalDate.now().plusMonths(16));
        b2.setQuantityOnHand(150);
        b2.setBuyingPrice(BigDecimal.valueOf(185.00));
        b2.setRetailPrice(BigDecimal.valueOf(250.00));
        b2.setWholesalePrice(BigDecimal.valueOf(210.00));
        b2.setDistributorPrice(BigDecimal.valueOf(195.00));
        batchRepository.save(b2);

        // Drug 2: Paracetamol 500mg
        Drug d2 = new Drug();
        d2.setName("Panadol Extra");
        d2.setGenericName("Paracetamol / Caffeine");
        d2.setCategory(catAnalgesics);
        d2.setDosageForm(DosageForm.TABLET);
        d2.setStrength("500mg/65mg");
        d2.setUnitOfMeasure(UOM_STRIP);
        d2.setBarcode("6009876543210");
        d2.setReorderThreshold(40);
        drugRepository.save(d2);

        DrugBatch b3 = new DrugBatch();
        b3.setDrug(d2);
        b3.setSupplier(s2);
        b3.setBranch(mainBranch);
        b3.setBatchNumber("PAN-2027-09");
        b3.setExpiryDate(LocalDate.now().plusMonths(14));
        b3.setQuantityOnHand(300);
        b3.setBuyingPrice(BigDecimal.valueOf(35.00));
        b3.setRetailPrice(BigDecimal.valueOf(55.00));
        b3.setWholesalePrice(BigDecimal.valueOf(42.00));
        b3.setDistributorPrice(BigDecimal.valueOf(38.00));
        batchRepository.save(b3);

        // Drug 3: Azithromycin 500mg
        Drug d3 = new Drug();
        d3.setName("Zithromax 500mg");
        d3.setGenericName("Azithromycin");
        d3.setCategory(catAntibiotics);
        d3.setDosageForm(DosageForm.TABLET);
        d3.setStrength("500mg");
        d3.setUnitOfMeasure(UOM_BOX);
        d3.setBarcode("6004567891230");
        d3.setReorderThreshold(15);
        d3.setPrescriptionRequired(true);
        drugRepository.save(d3);

        DrugBatch b4 = new DrugBatch();
        b4.setDrug(d3);
        b4.setSupplier(s1);
        b4.setBranch(mainBranch);
        b4.setBatchNumber("ZTH-2026-11");
        b4.setExpiryDate(LocalDate.now().plusMonths(8));
        b4.setQuantityOnHand(80);
        b4.setBuyingPrice(BigDecimal.valueOf(320.00));
        b4.setRetailPrice(BigDecimal.valueOf(450.00));
        b4.setWholesalePrice(BigDecimal.valueOf(375.00));
        b4.setDistributorPrice(BigDecimal.valueOf(350.00));
        batchRepository.save(b4);
    }
}
